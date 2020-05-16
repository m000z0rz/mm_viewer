const structs = {
 	"GlobalContext": {
 		"fields": [
 			{
 				"name": "cameraCtx",
 				"type": {
 					"name": "CameraContext"
				},
 				"offset": 0x0020
 			},
 			{
 				"name": "actorCtx",
 				"type": {
 					"name": "ActorContext"
				},
 				"offset": 0x01CA0
 			}
 		]
	},
 	"ActorContext": {
 		"fields": [
 			{
 				"name": "actorList",
				"type": {
					"name": "[]",
					"arrayOf": "ActorListEntry",
					"arrayLength": 12
				},
 				"offset": 0x010
 			}
 		]
 	},
 	"ActorListEntry": {
 		"fields": [
 			{
 				"name": "length",
 				"type": { "name": "s32" },
 				"offset": 0x0
 			},
 			{
 				"name": "first",
 				"type": {
 					"name": "*",
					"pointerTo": "Actor"
				},
				"offset": 0x4
 			},
 			{
 				"name": "pad8",
 				"type": {
					"name": "[]",
					"arrayOf": "UNK_TYPE1",
					"arrayLength": x
				},
 				"offset": 0x8,
 			}
 		]
 	},
 	"Actor": {
 		"fields": [
 			{
 				"name": "id",
 				"type": { "name": "s16" },
 				"offset": 0x000
 			},
 			{
 				"name": "type",
 				"type": { "name": "u8" },
 				"offset": 0x002,
 			},
			{
				"name": "initPosRot",
				"type": { "name": "PosRot" },
				"offset": 0x008,
			},
			{
				"name": "currPosRot",
				"type": { "name": "PosRot" },
				"offset": 0x024,
			},
			{
				"name": "topPosRot",
				"type": { "name": "PosRot" },
				"offset": 0x03C,
			},
			{
				"name": "scale",
				"type": { "name": "Vec3f" },
				"offset": 0x058,
			},
			{
				"name": "velocity",
				"type": { "name": "Vec3f" },
				"offset": 0x064,
			},
			{
				"name": "speedXZ",
				"type": { "name": "f32" },
				"offset": 0x070,
			},
			{
				"name": "wallPoly",
				"type": {
					"name": "*",
					"pointsTo": "BgPolygon"
				},
				"offset": 0x07C,
			},
			{
				"name": "floorPoly",
				"type": {
					"name": "*",
					"pointsTo": "BgPolygon"
				},
				"offset": 0x080,
			},
			{
				"name": "wallPolySource",
				"type": { "name": "u8" },
				"offset": 0x084,
			},
			{
				"name": "floorPolySource",
				"type": { "name": "u8" },
				"offset": 0x085,
			},

			{
				"name": "parent",
				"type": {
					"name": "*",
					"pointsTo": "Actor"
				},
				"offset": 0x120,
			},
			{
				"name": "child",
				"type": {
					"name": "*",
					"pointsTo": "Actor"
				},
				"offset": 0x124,
			},
			{
				"name": "prev",
				"type": {
					"name": "*",
					"pointsTo": "Actor"
				},
				"offset": 0x128,
			},
			{
				"name": "next",
				"type": {
					"name": "*",
					"pointsTo": "Actor"
				},
				"offset": 0x12C,
			},
			{
				"name": "init",
				"type": { "name": "actor_func" },
				"offset": 0x130,
			},
			{
				"name": "destroy",
				"type": { "name": "actor_func" },
				"offset": 0x134,
			},
			{
				"name": "update",
				"type": { "name": "actor_func" },
				"offset": 0x138,
			},
			{
				"name": "draw",
				"type": { "name": "actor_func" },
				"offset": 0x13C,
			},
			{
				"name": "overlayEntry",
				"type": {
					"name": "*",
					"pointsTo": "ActorOverlay"
				},
				"offset": 0x140,
			},
 		]
 	},
	"Vec3f": {
 		"fields": [
			{
				"name": "x",
				"type": { "name": "f32" },
				"offset": 0x0,
			},
			{
				"name": "y",
				"type": { "name": "f32" },
				"offset": 0x4,
			},
			{
				"name": "z",
				"type": { "name": "f32" },
				"offset": 0x8,
			}
		],
		"size": 0xC
	},
	"Vec3s": {
		"fields": [
			{
				"name": "x",
				"type": { "name": "s16" },
				"offset": 0x0,
			},
			{
				"name": "y",
				"type": { "name": "s16" },
				"offset": 0x2,
			},
			{
				"name": "z",
				"type": { "name": "s16" },
				"offset": 0x4,
			}
		],
		"size": 0x6
	},
	"PosRot": {
 		"fields": [
			{
				"name": "pos",
				"type": { "name": "Vec3f" },
				"offset": 0x0,
			},
			{
				"name": "rot",
				"type": { "name": "Vec3s" },
				"offset": 0xC
			},
		],
	},
	"ActorOverlay": {
 		"fields": [
			{
				"name": "vromStart",
				"type": { "name": "u32" },
				"offset": 0x00,
			},
			{
				"name": "vromEnd",
				"type": { "name": "u32" },
				"offset": 0x04,
			},
			{
				"name": "vramStart",
				"type": { "name": "u32" }, // void*
				"offset": 0x08,
			},
			{
				"name": "vramEnd",
				"type": { "name": "u32" }, // void*
				"offset": 0x0C,
			},
			{
				"name": "loadedRamAddr",
				"type": { "name": "u32" }, // void*
			},
			// 	/* 0x14 */ ActorInit* initInfo;
			{
				"name": "name",
				"type": {
					"name": "*",
					"pointerTo": "char"
				}
			}
			// 	/* 0x1C */ u16 allocType; // bit 0: don't allocate memory, use actorContext->0x250? bit 1: Always keep loaded?
			// 	/* 0x1E */ s8 nbLoaded; // original name: "clients"
			// 	/* 0x1F */ UNK_TYPE1 pad1F[0x1];
		],
		"size": 0x20
	},



	// needed structs: BgPolygon, actor_func,

};

const basic_sizes = {
	"*": 0x4,
	"f32": 0x4,
	"u32": 0x4,
	"s32": 0x4,
	"s16": 0x2,
	"u16": 0x2,
	"s8": 0x1,
	"u8": 0x1,

	// TOOD: fix
	"actor_func": 0x4
};

function argmax(arr, valuefunc) {
	if (arr.length === 0) {
		return -1;
	}

	var max = valuefunc(arr[0]);
	var maxIndex = 0;

	for (var i = 1; i < arr.length; i++) {
		if (valuefunc(arr[i]) > max) {
			maxIndex = i;
			max = arr[i];
		}
	}

	return arr[maxIndex];
}

function size(type)
{
	var ret = basic_sizes[type.name];
	if (ret !== undefined)
	{
		return ret;
	}

	if (type.name === "[]")
	{
		return type.arrayCount * size(structs[type.arrayOf]);
	}

	const struct = structs[type.name];
	if (struct.size !== undefined)
	{
		return struct.size;
	}

	const lastField = argmax(struct.fields, function(field) { return field.offset; });
	return lastField.offset + size(lastField.type);
}

structs.forEach(function(struct) {
	struct.byName = {};
	struct.byOffset = {};

	struct.size = size({ "name": struct.name });
	struct.fields.forEach(function(field) {
		struct.byName[field.name] = field;
		struct.byOffset[field.offset] = field;
	});
});

module.exports = structs;