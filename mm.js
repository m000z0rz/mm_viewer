// This is the main script to place in Proejct64's Scripts directory


// **************************** Imports *******************************************

// some setup is required in PJ64 source for Duktape to provide require
// For now, we use a makeshift version
var makeshift_require = (function () {
    const module_exports = {};

    return function makeshift_require(path) {
        if (module_exports[path] !== undefined) {
            return module_exports[path].exports;
        }

        const script = fs.readFile(path);
        const module = {};
        const val = eval(
            "(function (module, makeshift_require) {\n"
            + script
            + "}) (module, makeshift_require)"
        );

        if (module.exports !== undefined) {
            console.log("setting via exports");
            module_exports[path] = module.exports;

        } else {
            console.log("setting via val");
            module_exports[path] = val;
        }

        return module_exports[path];
    }
})();


const types = makeshift_require("./Scripts/mm/definitions/types.js");
const global_variables = makeshift_require("./Scripts/mm/definitions/global_variables.js");
const http = makeshift_require("./Scripts/mm/http.js");




// **************************** Server *******************************************
var server = new Server({port: 7777});

server.on('connection', function (client) {
    client.on('data', function (data) {
        try {
            const request = http.parseHttpRequest(data.toString());
            routeRequest(client, request);
        } catch (ex) {
            console.log("exception ", ex);
        }
    });
});
console.log("Server running");


const routeTable = [
    ["/", routeIndexPage],
    ["/map", routeActorMapJSON],
    ["/data", routeGlobalVariablesPage],
    ["/data/", routeGlobalVariablesPage],
    ["/j/data", routeGlobalVariablesJSON],
    ["/j/data/", routeGlobalVariablesJSON],
    ["/data/*", routeDataPage],
    ["/j/data/*", routeDataJSON],
    ["/static/*", routeStatic],
    ["/favicon.png", routeFavicon]
];

function routeRequest(client, request) {
    const path = request.path;
    var routePath;
    var routeHandler;

    for (var i = 0; i < routeTable.length; i++) {
        routePath = routeTable[i][0];
        routeHandler = routeTable[i][1];

        if (routeMatches(path, routePath))
        {
            request.subPath = getSubPath(path, routePath);
            routeHandler(client, request);
        }
    }

    // If we made it this far, we couldn't find a route handler. 404
    console.log("404: " + path);
    http.httpResponse(client, "404", "text/plain", 404);
}

function routeMatches(path, routePath)
{
    if (routePath.substr(-1) === "*")
    {
        if (path.substr(0, routePath.length - 1)
            === routePath.substr(0, routePath.length - 1)) {
            return true;
        }
    } else if (path === routePath) {
        return true;
    }

    return false;
}

function getSubPath(path, routePath)
{
    if (routePath.substr(-1) !== "*")
    {
        return "";
    }

    return path.substr(routePath.length - 1);
}



// **************************** Route handlers *******************************************

function routeIndexPage(client, request) {
    templateResponse(client, "map", undefined);
}

function routeActorMapJSON(client, request) {
    // Map data
    http.jsonResponse(client, getData());
}

function routeGlobalVariablesPage(client, request) {
    // Global Variables (data root)
    const model = {
        "breadcrumbs": breadcrumbs(request.subPath),
        "globalVariables": global_variables.byName,
    };

    templateResponse(client, "data", model);
}

function routeDataPage(client, request) {
    const model = {
        "breadcrumbs": breadcrumbs(request.subPath),
        "data": getDataFromPath(request.subPath, request.params),
    };
    templateResponse(client, "data", model);
}

function routeGlobalVariablesJSON(client, request) {
    http.jsonResponse(client, global_variables.byName);
}

function routeDataJSON(client, request) {
    http.jsonResponse(client, getDataFromPath(request.subPath, request.params));
}

function routeStatic(client, request) {
    http.fileResponse(client, "./Scripts/mm/static/" + request.subPath);
}

function routeFavicon(client, request) {
    http.fileResponse(client, "./Scripts/mm/static/favicon.png");
}





// **************************** Template *******************************************

function breadcrumbs(path)
{
    const items = path.split("\n").filter(function(item) { return item !== ""; });
    var cumulativePath = "";
    return items.map(function(item) {
        cumulativePath += "/" + item;
        return {
            "fieldName": item,
            "path": cumulativePath
        };
    });
}

function templateResponse(client, name, pageModel) {
    var template = fs.readFile("./Scripts/mm/html/template.html").toString();
    const innerFilename = "./Scripts/mm/html/" + name + ".html";
    const scriptFilename = "/static/" + name + ".js";
    const scriptTag = "<script src=\"" + scriptFilename + "\"></script>";
    const inner = fs.readFile(innerFilename).toString();

    var model = {
        "nav": undefined,
        "page": pageModel
    };

    template = template.replace("{{INNER}}", inner);
    template = template.replace("{{NAME}}", name);
    template = template.replace("{{SCRIPT}}", scriptTag);
    template = template.replace("{{MODEL}}", JSON.stringify(model));
    http.httpResponse(client, template, "text/html");
}


// **************************** Data getting stuff *******************************************

// path something like actorCutscenesGlobalCtxt/actorCtx/actorList[0]
function getDataFromPath(path, params) {

    // console.log("getDataFromPath path", path);
    // console.log("getDataFromPath params", params);

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
    return valueAt(offset, type, path.split("/")[-1]);
}

function memArrayBuffer(address, size) {
    const block = mem.getblock(address, size);
    const buf = new ArrayBuffer(block.byteLength);
    const u8arr = new Uint8Array(buf);
    u8arr.set(new Uint8Array(block));
    return buf;
}

function valueAt(address, type, name) {
    const buf = memArrayBuffer(address, type.size());
    return asType(buf, type, name, address);
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
function asType(buffer, type, name, address) {
    // add special handling for char* here, assuming it's null string
    if (type.isBasic) {
        const dv = new DataView(buffer);
        return {
            "value": dv[type.basicReadFunction](),
            "typeName": type.typeName,
            "name": name,
            "address": address.toString(16)
        };
    } else if (type.isPointer) {
        const dv = new DataView(buffer);
        return {
            "value": dv.getUint32(),
            "typeName": type.typeName,
            "name": name,
            "address": address.toString(16)
        };
    } else if (type.isStruct) {
        // else, it's a struct
        const obj = {
            "typeName": type.typeName,
            "fields": {},
            "fieldDefinitions": type.fields,
            "name": name,
            "address": address.toString(16)
        };

        type.fields.forEach(function (field) {
            var fieldType = field.type();
            obj.fields[field.name] = asType(
                buffer.slice(field.offset, field.offset + fieldType.size()),
                fieldType,
                field.name,address + field.offset
            );
        });

        return obj;
    } else if (type.isArray) {
        const values = {
            "values": [],
            "typeName": type.typeName,
            "name": name,
            "address": address.toString(16)
        };
        const valueType = type.arrayOf();
        const valueSize = valueType.size();
        for (var i = 0; i < type.arrayLength; i++) {
            values.values.push(
                asType(
                    buffer.slice(i * valueSize, (i + 1) * valueSize),
                    valueType,
                    name + "[" + i + "]",
                    address + i * valueSize,
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
