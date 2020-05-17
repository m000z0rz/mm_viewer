// This is the main script to place in Proejct64's Scripts directory

// some setup is required in PJ64 source for Duktape to provide require
// For now, we use a makeshift version
var makeshift_require = (function () {
    const module_exports = {};

    return function makeshift_require(path) {
        if (module_exports[path] !== undefined) {
            return module_exports[path].exports;
        }

        const script = fd.readFile(path);
        const module = {};
        const val = eval(
            "(function (module, makeshift_require) {\n"
            + script
            + "}) (module, makeshift_require)"
        );

        if (module.exports !== undefined) {
            module_exports[path] = module.exports;

        }

        module_exports[path] = val;

        return module_exports[path];
    }
})();


// const types = make_types();
// const global_variables = make_global_variables(types);
const types = makeshift_require("./Scripts/mm/definitions/types.js");
const global_variables = makeshift_require("./Scripts/mm/definitions/global_variables.js");
const http = makeshift_require("./Scripts/mm/http.js");


//const v = valueAt(0x801BD8C0, types.getType("GlobalContext*"));

// console.log("v3");
// const v3 = valueAt(v.value, types.getType("GlobalContext"));
// console.log(JSON.stringify(v3));
//
// console.log("via path");
// const v4 = getDataFromPath("actorCutscenesGlobalCtxt/actorCtx/actorList", {});
// console.log(JSON.stringify(v4));


// const uriParts = parseURIParams("actorCutscenesGlobalCtxt/actorCtx/actorList");
// //var obj2 = getDataFromPath(uriParts.path, uriParts.params);
// const v4 = getDataFromPath(uriParts.path, {});
//  console.log(JSON.stringify(v4));
//throw new Error("blah");

var server = new Server({port: 7777});

server.on('connection', function (client) {
    client.on('data', function (data) {
        try {
            const request = http.parseHttpRequest(data.toString());
            processGetRequest(client, request);
        } catch (ex) {
            console.log("exception ", ex);
        }
    });
});
console.log("Server running");

function processGetRequest(client, request) {
    const path = request.path;
    //const headers = request.headers;
    if (path === "/") {
        console.log("index");
        http.fileResponse(client, "./Scripts/mm/index.html");
        console.log("index done");
    } else if (path === "/test") {
        http.jsonResponse(client, getData());
    } else if (path.indexOf("/jv/") === 0) {
        const uriParts = http.parseURIParams(path.slice(3));
        var obj2 = getDataFromPath(uriParts.path, uriParts.params);

        //console.log("v path obj", obj2);
        http.jsonResponse(client, obj2);
    } else if (path.indexOf("/static/") === 0) {
        console.log("static");
        http.fileResponse(client, "./Scripts/mm/static/" + path.substr("/static/".length));
        console.log("static done");
    } else {
    	console.log("404: " + path);
        http.httpResponse(client, "404", "text/plain", 404);
    }

}


// path something like actorCutscenesGlobalCtxt/actorCtx/actorList[0]
// path is array of locations, params is any extra ?a=b junk
function getDataFromPath(path, params) {

    console.log("getDataFromPath path", path);
    console.log("getDataFromPath params", params);

    var offset = 0x0;
    var fields = undefined;
    var type = undefined;

    fields = global_variables.byName;

    path.split("/").forEach(function (location) {
        if (fields === undefined) {
            console.log("Couldn't find more fields at " + location + " in " + path);
            return undefined;
        }

        var fieldName = location;
        var fieldIndex = undefined;
        var rest = "";
        if (location.indexOf("[") !== -1) {
            var start = location.indexOf("[");
            fieldName = location.substr(0, start);
            var end = location.indexOf("]", start);
            fieldIndex = parseInt(location.substr(start + 1, end));
            rest = location.substr(end + 1);
        }

        if (fields[fieldName] === undefined) {
            console.log("Couldn't find " + fieldName + " in " + path);
            return undefined;
        }

        field = fields[fieldName];
        type = field.type();
        offset += field.offset;

        // prep next fields is possible
        if (type.isPointer) {
            offset = mem.u32[offset];
            fields = type.pointsTo().field;
            //console.log("new pointy fields len ", fields.length);
        } else if (type.isStruct) {
            fields = type.field;
        } else if (type.isArray) {
            if (fieldIndex !== undefined) {
                type = type.arrayOf();
                console.log("array typ esize " + type.size());
                offset += fieldIndex * type.size();
            }
            return undefined;
        }
    });

    //return [offset, type];
    // offset should now point to the thing we want, and type should be the appropriate type
    return valueAt(offset, type);
}

function memArrayBuffer(address, size) {
    const block = mem.getblock(address, size);
    const buf = new ArrayBuffer(block.byteLength);
    const u8arr = new Uint8Array(buf);
    u8arr.set(new Uint8Array(block));
    return buf;
}

function valueAt(address, type) {
    const buf = memArrayBuffer(address, type.size());
    return asType(buf, type, address);
}

//
// const basic_type_reads = {
// 	"u8": "getUint8",
// 	"s8": "getInt8",
// 	"u16": "getUint16",
// 	"s16": "getInt16",
// 	"u32": "getUint32",
// 	"s32": "getInt32",
// 	"f32": "getFloat32",
// 	"*": "u32"
// };
//
function asType(buffer, type, address) {
    // add special handling for char* here, assuming it's null string
    if (type.isBasic) {
        const dv = new DataView(buffer);
        return {
            "value": dv[type.basicReadFunction](),
            "typeName": type.typeName,
            "address": address.toString(16)
        };
    } else if (type.isPointer) {
        const dv = new DataView(buffer);
        return {
            "value": dv.getUint32(),
            "typeName": type.typeName,
            "address": address.toString(16)
        };
    } else if (type.isStruct) {
        // else, it's a struct
        const obj = {
            "typeName": type.typeName,
            "fields": {},
            "fieldDefinitions": type.fields,
            "address": address.toString(16)
        };

        type.fields.forEach(function (field) {
            var fieldType = field.type();
            obj.fields[field.name] = asType(buffer.slice(field.offset, field.offset + fieldType.size()), fieldType, address + field.offset);
        });

        return obj;
    } else if (type.isArray) {
        const values = {
            "values": [],
            "typeName": type.typeName,
            "address": address.toString(16)
        };
        const valueType = type.arrayOf();
        const valueSize = valueType.size();
        for (var i = 0; i < type.arrayLength; i++) {
            values.values.push(
                asType(
                    buffer.slice(i * valueSize, (i + 1) * valueSize),
                    valueType,
                    address + i * valueSize
                )
            );
        }
        return values;
    } else {
        console.log("failed at reading type ", type.typeName);
        return undefined;
    }
}





// **************************** MM *******************************************

function getData() {
    var globalContextAddress = mem.u32[0x801BD8C0];
    var actorContextAddress = globalContextAddress + 0x01CA0;
    var actorListEntriesTableAddress = actorContextAddress + 0x10;


    mem.f32 = mem.float;
    mem.f64 = mem.double;

    ret = [];

    for (var i = 0; i < 12; i++) {
        var actorListEntryAddress = actorListEntriesTableAddress + 0xC * i;
        var actorCount = mem.s32[actorListEntryAddress];
        if (actorCount === 0)
            continue;

        var actorAddress = mem.u32[actorListEntryAddress + 0x4];

        objs = [];
        //str += actorCount + " of:\n";
        for (var actorIndex = 0; actorIndex < actorCount; actorIndex++) {
            var actor = makeActor(actorAddress)
            objs.push(actor);

            actorAddress = mem.u32[actorAddress + 0x12C]; // next
        }

        ret.push(objs);
    }

    return ret;
};

function makeActor(actorAddress) {
    var id = mem.u16[actorAddress + 0x00];
    var currPosRotAddress = actorAddress + 0x24;
    var speedXZ = mem.f32[actorAddress + 0x70];
    var sqDistanceFromLink = mem.f32[actorAddress + 0x98];
    var textId = mem.u16[actorAddress + 0x116];


    if (id === 649) {
        //mem.f32[currPosRotAddress + 0x4] += 10.0;
        mem.s16[currPosRotAddress + 0xC + 0x2] += 100.0;
    }

    return {
        id: id,
        currPosRot: makeCurrPosRot(currPosRotAddress),
        speedXZ: speedXZ,
        sqDistanceFromLink: sqDistanceFromLink,
        textId: textId
    };
}

function makeCurrPosRot(address) {
    return {
        pos: makeVec3f(address + 0x0),
        rot: makeVec3s(address + 0xC)
    };
}

function makeVec3f(address) {
    return {
        x: mem.f32[address + 0x0],
        y: mem.f32[address + 0x4],
        z: mem.f32[address + 0x8]
    };
}

function makeVec3s(address) {
    return {
        x: mem.s16[address + 0x0],
        y: mem.s16[address + 0x2],
        z: mem.s16[address + 0x4]
    };
}
//
// function Vec3fToString(address) {
//     var x = mem.f32[address + 0x0];
//     var y = mem.f32[address + 0x4];
//     var z = mem.f32[address + 0x8];
//     return ("(" + x + ", " + y + ", " + z + ")");
// }
//
// function Vec3sToString(address) {
//     var x = mem.s16[address + 0x0];
//     var y = mem.s16[address + 0x2];
//     var z = mem.s16[address + 0x4];
//     return "(" + x + ", " + y + ", " + z + ")";
// }
//
// function PosRotToString(address) {
//     return Vec3fToString(address + 0x0) + ", " + Vec3sToString(address + 0xC);
// }
