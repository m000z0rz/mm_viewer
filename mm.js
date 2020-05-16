// This is the main script to place in Proejct64's Scripts directory

// some setup is required in PJ64 source for Duktape to provide require
// For now, we use a makeshift version
var makeshift_require = (function() {
	const module_exports = {};

	return function makeshift_require(path)
	{
		if (module_exports[path] !== undefined)
		{
			return module_exports[path].exports;
		}

		const script = fd.readFile(path);
		const module = {};
		const val = eval(
			"(function (module, makeshift_require) {\n"
			+ script
			+ "}) (module, makeshift_require)"
		);

		if (module.exports !== undefined)
		{
			module_exports[path] = module.exports;

		}

		module_exports[path] = val;

		return module_exports[path];
	}
}) ();



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

server.on('connection', function(client)
{
	client.on('data', function(data)
	{
		try {
			const request = http.parseHttpRequest(data.toString());
			processGetRequest(client, request);
		}
		catch (ex) {
			console.log("exception ", ex);
		}
	});
});
console.log("Server running");

function processGetRequest(client, request)
{
	const path = request.path;
	//const headers = request.headers;
	if (path === "/" )
	{
		console.log("index");
		http.fileResponse(client, "./Scripts/mm/index.html");
		console.log("index done");
	}
	else if (path === "/test")
	{
		http.jsonResponse(client, getData());
	}
	else if (path.indexOf("/v/") === 0)
	{
		const uriParts = http.parseURIParams(path.slice(3));
		var obj2 = getDataFromPath(uriParts.path, uriParts.params);

		//console.log("v path obj", obj2);
		http.jsonResponse(client, obj2);
	}
	else if (path.indexOf("/static/") === 0)
	{
		console.log("static");
		http.fileResponse(client, "./Scripts/mm/static/" + path.substr("/static/".length));
		console.log("static done");
	}
	else
	{
		http.httpResponse(client, "404", "text/plain", 404);
	}

}


// path something like actorCutscenesGlobalCtxt/actorCtx/actorList[0]
// path is array of locations, params is any extra ?a=b junk
function getDataFromPath(path, params)
{

	console.log("getDataFromPath path", path);
	console.log("getDataFromPath params", params);

	var offset = 0x0;
	var fields = undefined;
	var type = undefined;

	fields = global_variables.byName;

	path.split("/").forEach(function(location) {
		if (fields === undefined)
		{
			console.log("Couldn't find more fields at " + location + " in " + path);
			return undefined;
		}

		var fieldName = location;
		var fieldIndex = undefined;
		var rest = "";
		if (location.indexOf("[") !== -1)
		{
			var start = location.indexOf("[");
			fieldName = location.substr(0, start);
			var end = location.indexOf("]", start);
			fieldIndex = parseInt(location.substr(start + 1, end));
			rest = location.substr(end+1);
		}

		if (fields[fieldName] === undefined)
		{
			console.log("Couldn't find " + fieldName + " in " + path);
			return undefined;
		}

		field = fields[fieldName];
		type = field.type();
		offset += field.offset;

		// prep next fields is possible
		if (type.isPointer)
		{
			offset = mem.u32[offset];
			fields = type.pointsTo().field;
			//console.log("new pointy fields len ", fields.length);
		}
		else if (type.isStruct)
		{
			fields = type.field;
		}
		else if (type.isArray)
		{
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

function memArrayBuffer(address, size)
{
	const block = mem.getblock(address, size);
	const buf = new ArrayBuffer(block.byteLength);
	const u8arr = new Uint8Array(buf);
	u8arr.set(new Uint8Array(block));
	return buf;
}

function valueAt(address, type)
{
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
function asType(buffer, type, address)
{
	// add special handling for char* here, assuming it's null string
	if (type.isBasic)
	{
		const dv = new DataView(buffer);
		return {
			"value": dv[type.basicReadFunction](),
			"typeName": type.typeName,
			"address": address.toString(16)
		};
	}
	else if (type.isPointer)
	{
		const dv = new DataView(buffer);
		return {
			"value": dv.getUint32(),
			"typeName": type.typeName,
			"address": address.toString(16)
		};
	}
	else if (type.isStruct) {
		// else, it's a struct
		const obj = {
			"typeName": type.typeName,
			"fields": {},
			"fieldDefinitions": type.fields,
			"address": address.toString(16)
		};

		type.fields.forEach(function(field) {
			var fieldType = field.type();
			obj.fields[field.name] = asType(buffer.slice(field.offset, field.offset + fieldType.size()), fieldType, address + field.offset);
		});

		return obj;
	}
	else if (type.isArray) {
		const values = {
			"values": [],
			"typeName": type.typeName,
			"address": address.toString(16)
		};
		const valueType = type.arrayOf();
		const valueSize = valueType.size();
		for (var i = 0; i < type.arrayLength; i++)
		{
			values.values.push(
				asType(
					buffer.slice(i * valueSize, (i + 1) * valueSize),
					valueType,
					address + i * valueSize
				)
			);
		}
		return values;
	}
	else
	{
		console.log("failed at reading type ", type.typeName);
		return undefined;
	}
}














// ************************* UTIL ******************************
























// **************************** MM *******************************************

function getData()
{
	var globalContextAddress = mem.u32[0x801BD8C0];
	var actorContextAddress = globalContextAddress + 0x01CA0;
	var actorListEntriesTableAddress = actorContextAddress + 0x10;


	mem.f32 = mem.float;
	mem.f64 = mem.double;

	ret = [];

	for (var i = 0; i < 12; i++)
	{
		var actorListEntryAddress = actorListEntriesTableAddress + 0xC * i;
		var actorCount = mem.s32[actorListEntryAddress];
		if (actorCount == 0)
			continue;

		var actorAddress = mem.u32[actorListEntryAddress + 0x4];

		objs = [];
		//str += actorCount + " of:\n";
		for (var actorIndex = 0; actorIndex < actorCount; actorIndex++)
		{
			var actor = makeActor(actorAddress)
			objs.push(actor);
				
			actorAddress = mem.u32[actorAddress + 0x12C]; // next
		}

		ret.push(objs);
	}

	return ret;
};

function makeActor(actorAddress)
{
	var id = mem.u16[actorAddress + 0x00];
	var currPosRotAddress = actorAddress + 0x24;
	var speedXZ = mem.f32[actorAddress + 0x70];
	var sqDistanceFromLink = mem.f32[actorAddress + 0x98];
	var textId = mem.u16[actorAddress + 0x116];
	

	if (id === 649)
	{
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

function makeCurrPosRot(address)
{
	return {
		pos: makeVec3f(address + 0x0),
		rot: makeVec3s(address + 0xC)
	};
}

function makeVec3f(address)
{
	return {
		x: mem.f32[address + 0x0],
		y: mem.f32[address + 0x4],
		z: mem.f32[address + 0x8]
	};
}

function makeVec3s(address)
{
	return {
		x: mem.s16[address + 0x0],
		y: mem.s16[address + 0x2],
		z: mem.s16[address + 0x4]
	};
}

function Vec3fToString(address)
{
	var x = mem.f32[address + 0x0];
	var y = mem.f32[address + 0x4];
	var z = mem.f32[address + 0x8];
	return ("(" + x + ", " + y + ", " + z + ")");
}

function Vec3sToString(address)
{
	var x = mem.s16[address + 0x0];
	var y = mem.s16[address + 0x2];
	var z = mem.s16[address + 0x4];
	return "(" + x + ", "  + y + ", " + z + ")";	
}

function PosRotToString(address)
{
	return Vec3fToString(address + 0x0) + ", " + Vec3sToString(address + 0xC);
}


// PosRot is 0x0 Vec3f pos, 0xC Vec3s rot; Vec3f is 0x0, 0x04, 0x8 f32 x y z, Vec3s is s16 0x0, 0x2, 0x4

//mem.bindvar(this, 0x801BD8C0, 'lpGlobalContext', u32);

















// function make_types() {
// 	const structTypes = [
// 		{
// 			"name": "GlobalContext",
// 			"fields": [
// 				{
// 					"name": "cameraCtx",
// 					"typeName": "CameraContext",
// 					"offset": 0x0020
// 				},
// 				{
// 					"name": "actorCtx",
// 					"typeName": "ActorContext",
// 					"offset": 0x01CA0
// 				}
// 			]
// 		},
// 		{
// 			"name": "CameraContext",
// 			"fields": [
// 				{
// 					"name": "activeCameras",
// 					"typeName": "Camera[4]",
// 					"offset": 0x00
// 				},
// 				{
// 					"name": "activeACameraPtrs",
// 					"typeName": "Camera*[]",
// 					"offset": 0x5E0
// 				},
// 				{
// 					"name": "activeCamera",
// 					"typeName": "s16",
// 					"offset": 0x5F0
// 				},
// 				{
// 					"name": "unk5F2",
// 					"typeName": "s16",
// 					"offset": 0x5F2,
// 				}
// 			]
// 		},
// 		{
// 			"name": "Camera",
// 			"fields": [
// 				{
// 					"name": "focalPoint",
// 					"typeName": "Vec3f",
// 					"offset": 0x050,
// 				},
// 				{
// 					"name": "eye",
// 					"typeName": "Vec3f",
// 					"offset": 0x05C,
// 				},
// 				{
// 					"name": "player",
// 					"typeName": "Actor*", // Actually ActorPlayer*
// 					"offset": 0x090
// 				},
// 			]
// 		},
// 		{
// 			"name": "ActorContext",
// 			"fields": [
// 				{
// 					"name": "actorList",
// 					"typeName": "ActorListEntry[12]",
// 					"offset": 0x010
// 				}
// 			]
// 		},
// 		{
// 			"name": "ActorListEntry",
// 			"fields": [
// 				{
// 					"name": "length",
// 					"typeName": "s32",
// 					"offset": 0x0
// 				},
// 				{
// 					"name": "first",
// 					"typeName": "Actor*",
// 					"offset": 0x4
// 				},
// 				{
// 					"name": "pad8",
// 					"typeName": "UNK_TYPE1[8]",
// 					"offset": 0x8,
// 				}
// 			]
// 		},
// 		{
// 			"name": "Actor",
// 			"fields": [
// 				{
// 					"name": "id",
// 					"typeName": "s16",
// 					"offset": 0x000
// 				},
// 				{
// 					"name": "type",
// 					"typeName": "u8",
// 					"offset": 0x002,
// 				},
// 				{
// 					"name": "initPosRot",
// 					"typeName": "PosRot",
// 					"offset": 0x008,
// 				},
// 				{
// 					"name": "currPosRot",
// 					"typeName": "PosRot",
// 					"offset": 0x024,
// 				},
// 				{
// 					"name": "topPosRot",
// 					"typeName": "PosRot",
// 					"offset": 0x03C,
// 				},
// 				{
// 					"name": "scale",
// 					"typeName": "Vec3f",
// 					"offset": 0x058,
// 				},
// 				{
// 					"name": "velocity",
// 					"typeName": "Vec3f",
// 					"offset": 0x064,
// 				},
// 				{
// 					"name": "speedXZ",
// 					"typeName": "f32",
// 					"offset": 0x070,
// 				},
// 				// {
// 				// 	"name": "wallPoly",
// 				// 	"typeName": "BgPolygon*",
// 				// 	"offset": 0x07C,
// 				// },
// 				// {
// 				// 	"name": "floorPoly",
// 				// 	"typeName": "BgPolygon*",
// 				// 	"offset": 0x080,
// 				// },
// 				{
// 					"name": "wallPolySource",
// 					"typeName": "u8",
// 					"offset": 0x084,
// 				},
// 				{
// 					"name": "floorPolySource",
// 					"typeName": "u8",
// 					"offset": 0x085,
// 				},
//
// 				{
// 					"name": "parent",
// 					"typeName": "Actor*",
// 					"offset": 0x120,
// 				},
// 				{
// 					"name": "child",
// 					"typeName": "Actor*",
// 					"offset": 0x124,
// 				},
// 				{
// 					"name": "prev",
// 					"typeName": "Actor*",
// 					"offset": 0x128,
// 				},
// 				{
// 					"name": "next",
// 					"typeName": "Actor*",
// 					"offset": 0x12C,
// 				},
// 				{
// 					"name": "init",
// 					"typeName": "actor_func",
// 					"offset": 0x130,
// 				},
// 				{
// 					"name": "destroy",
// 					"typeName": "actor_func",
// 					"offset": 0x134,
// 				},
// 				{
// 					"name": "update",
// 					"typeName": "actor_func",
// 					"offset": 0x138,
// 				},
// 				{
// 					"name": "draw",
// 					"typeName": "actor_func",
// 					"offset": 0x13C,
// 				},
// 				{
// 					"name": "overlayEntry",
// 					"typeName": "ActorOverlay*",
// 					"offset": 0x140,
// 				},
// 			]
// 		},
// 		{
// 			"name": "Vec3f",
// 			"fields": [
// 				{
// 					"name": "x",
// 					"typeName": "f32",
// 					"offset": 0x0,
// 				},
// 				{
// 					"name": "y",
// 					"typeName": "f32",
// 					"offset": 0x4,
// 				},
// 				{
// 					"name": "z",
// 					"typeName": "f32",
// 					"offset": 0x8,
// 				}
// 			],
// 			"size": 0xC
// 		},
// 		{
// 			"name": "Vec3s",
// 			"fields": [
// 				{
// 					"name": "x",
// 					"typeName": "s16",
// 					"offset": 0x0,
// 				},
// 				{
// 					"name": "y",
// 					"typeName": "s16",
// 					"offset": 0x2,
// 				},
// 				{
// 					"name": "z",
// 					"typeName": "s16",
// 					"offset": 0x4,
// 				}
// 			],
// 			"size": 0x6
// 		},
// 		{
// 			"name": "PosRot",
// 			"fields": [
// 				{
// 					"name": "pos",
// 					"typeName": "Vec3f",
// 					"offset": 0x0,
// 				},
// 				{
// 					"name": "rot",
// 					"typeName": "Vec32",
// 					"offset": 0xC
// 				},
// 			],
// 		},
// 		{
// 			"name": "ActorOverlay",
// 			"fields": [
// 				{
// 					"name": "vromStart",
// 					"typeName": "u32",
// 					"offset": 0x00,
// 				},
// 				{
// 					"name": "vromEnd",
// 					"typeName": "u32",
// 					"offset": 0x04,
// 				},
// 				{
// 					"name": "vramStart",
// 					"typeName": "void*",
// 					"offset": 0x08,
// 				},
// 				{
// 					"name": "vramEnd",
// 					"typeName": "void*",
// 					"offset": 0x0C,
// 				},
// 				{
// 					"name": "loadedRamAddr",
// 					"typeName": "void*",
// 				},
// 				// 	/* 0x14 */ ActorInit* initInfo;
// 				{
// 					"name": "name",
// 					"typeName": "char*",
// 				}
// 				// 	/* 0x1C */ u16 allocType; // bit 0: don't allocate memory, use actorContext->0x250? bit 1: Always keep loaded?
// 				// 	/* 0x1E */ s8 nbLoaded; // original name: "clients"
// 				// 	/* 0x1F */ UNK_TYPE1 pad1F[0x1];
// 			],
// 			"size": 0x20,
// 		},
//
//
//
// 		// needed structs: BgPolygon, actor_func,
//
// 	];
//
// 	const basic_sizes = {
// 		"*": 0x4,
// 		"f32": 0x4,
// 		"u32": 0x4,
// 		"s32": 0x4,
// 		"s16": 0x2,
// 		"u16": 0x2,
// 		"s8": 0x1,
// 		"u8": 0x1,
// 	};
//
// 	typeMap = {};
//
// 	// Basic types
// 	typeMap.u8 = new Type("u8", undefined, 1, "getUint8");
// 	typeMap.s8 = new Type("s8", undefined, 1, "getInt8");
// 	typeMap.u16 = new Type("u16", undefined, 2, "getUint16");
// 	typeMap.s16 = new Type("s16", undefined, 2, "getInt16");
// 	typeMap.u32 = new Type("u32", undefined, 4, "getUint32");
// 	typeMap.s32 = new Type("s32", undefined, 4, "getInt32");
// 	typeMap.f32 = new Type("f32", undefined, 4, "getFloat32");
// 	typeMap["char*"] = new Type("char*", undefined, 4, "getUint32");
// 	typeMap["void*"] = new Type("void*", undefined, 4, "getUint32");
//
//
// 	// Aliase
//
// 	type_aliases = {
// 		"actor_func": "void*",
// 		"UNK_TYPE1": "u8"
// 	};
//
// 	Object.keys(type_aliases).forEach(function(alias)
// 	{
// 		typeMap[alias] = typeMap[type_aliases[alias]];
// 	});
//
//
//
// 	// Structs
// 	structTypes.forEach(function(struct) {
// 		typeMap[struct.name] = new Type(struct.name, struct.fields, struct.size, undefined);
// 	});
//
//
//
// 	function Type(typeName, fields, size, basicReadFunction)
// 	{
// 		this.typeName = typeName;
// 		this._size = size;
//
// 		this.isBasic = false;
// 		this.isPointer = false;
// 		this.isArray = false;
// 		this.isStruct = false;
//
// 		if (basicReadFunction !== undefined)
// 		{
// 			this.isBasic = true;
// 			this.basicReadFunction = basicReadFunction;
// 		}
//
// 		// special bottom types
// 		if (typeName === "char*" || typeName === "void*")
// 		{
// 			this.name = typeName;
// 			return;
// 		}
//
//
// 		if (typeName.indexOf("[") !== -1)
// 		{
// 			this.isArray = true;
// 			var open = typeName.indexOf("[");
// 			var close = typeName.indexOf("]", open);
// 			this.arrayOfTypeName = typeName.substr(0, open) + typeName.substr(close + 1);
// 			this.arrayLength = parseInt(typeName.substr(open + 1, close));
// 		}
// 		else if (typeName.indexOf("*") !== -1)
// 		{
// 			this.isPointer = true;
// 			this.pointsToTypeName = typeName.slice(0, -1);
// 		}
// 		else if (fields !== undefined)
// 		{
// 			var that = this;
// 			this.isStruct = true;
// 			// Copy fields
// 			this.fields = fields.slice();
// 			this.field = {};
//
// 			this.fields.forEach(function(field) {
// 				that.field[field.name] = field;
// 				field.type = function()
// 				{
// 					return getType(field.typeName);
// 				}
// 			});
// 		}
//
// 		this.pointsTo = function()
// 		{
// 			return this.isPointer ? getType(this.pointsToTypeName) : undefined;
// 		}
//
// 		this.arrayOf = function()
// 		{
// 			return this.isArray ? getType(this.arrayOfTypeName) : undefined;
// 		}
//
// 		this.size = function()
// 		{
// 			if (this._size === undefined)
// 			{
// 				this._size = type_size(this);
// 			}
// 			return this._size;
// 		}
// 	}
//
//
//
// 	function getType(typeName)
// 	{
// 		if (typeMap[typeName] === undefined)
// 		{
// 			// maybe nonbasic type name, make it
// 			typeMap[typeName] = new Type(typeName);
// 		}
//
// 		return typeMap[typeName];
// 	}
//
//
//
//
//
//
//
// 	function argmax(arr, valuefunc) {
// 		if (arr.length === 0) {
// 			return -1;
// 		}
//
// 		var max = valuefunc(arr[0]);
// 		var maxIndex = 0;
//
// 		for (var i = 1; i < arr.length; i++) {
// 			var val = valuefunc(arr[i])
// 			if (val > max) {
// 				maxIndex = i;
// 				max = val;
// 			}
// 		}
//
// 		return arr[maxIndex];
// 	}
//
//
//
// 	function type_size(type)
// 	{
// 		if (type.isArray)
// 		{
// 			return type.arrayLength * type.arrayOf().size();
// 		}
// 		if (type.isPointer)
// 		{
// 			return 4;
// 		}
// 		else if (type.isStruct) {
// 			const lastField = argmax(type.fields, function(field) { return field.offset; });
// 			return lastField.offset + lastField.type().size();
// 		}
// 		else
// 		{
// 			console.log("type sizing failed", JSON.stringify(type));
// 		}
//
// 		return undefined;
// 	}
//
//
// 	return {
// 		"typeMap": typeMap,
// 		"getType": getType
// 	};
// }





//
// function make_global_variables(types) {
// 	const globals = [
// 		{
// 			"name": "actorCutscenesGlobalCtxt",
// 			"offset": 0x801BD8C0,
// 			"typeName": "GlobalContext*",
// 		}
// 	];
//
// 	const global_variables = {
// 		"byName": {},
// 		"byOffset": {},
// 	};
//
// 	globals.forEach(function(glo) {
// 		global_variables.byName[glo.name] = glo;
// 		global_variables.byOffset[glo.offset] = glo;
// 		glo.type = function() { return types.getType(glo.typeName); };
// 	});
//
// 	return global_variables;
// }
