const structTypes = [
    {
        "name": "GlobalContext",
        "fields": [
            {
                "name": "cameraCtx",
                "typeName": "CameraContext",
                "offset": 0x0020
            },
            {
                "name": "actorCtx",
                "typeName": "ActorContext",
                "offset": 0x01CA0
            }
        ]
    },
    {
        "name": "CameraContext",
        "fields": [
            {
                "name": "activeCameras",
                "typeName": "Camera[4]",
                "offset": 0x00
            },
            {
                "name": "activeACameraPtrs",
                "typeName": "Camera*[]",
                "offset": 0x5E0
            },
            {
                "name": "activeCamera",
                "typeName": "s16",
                "offset": 0x5F0
            },
            {
                "name": "unk5F2",
                "typeName": "s16",
                "offset": 0x5F2,
            }
        ]
    },
    {
        "name": "Camera",
        "fields": [
            {
                "name": "unk4",
                "typeName": "Vec3f",
                "offset": 0x004
            },
            {
                "name": "unk20",
                "typeName": "Vec3f",
                "offset": 0x020
            },
            {
                "name": "focalPoint",
                "typeName": "Vec3f",
                "offset": 0x050,
            },
            {
                "name": "eye",
                "typeName": "Vec3f",
                "offset": 0x05C,
            },
            {
                "name": "upDir",
                "typeName": "Vec3f",
                "offset": 0x068
            },
            {
                "name": "unk74",
                "typeName": "Vec3f",
                "offset": 0x074
            },
            {
                "name": "player",
                "typeName": "Actor*", // Actually ActorPlayer*
                "offset": 0x090
            },
        ]
    },
    {
        "name": "ActorContext",
        "fields": [
            {
                "name": "actorList",
                "typeName": "ActorListEntry[12]",
                "offset": 0x010
            }
        ]
    },
    {
        "name": "ActorListEntry",
        "fields": [
            {
                "name": "length",
                "typeName": "s32",
                "offset": 0x0
            },
            {
                "name": "first",
                "typeName": "Actor*",
                "offset": 0x4
            },
            // {
            //     "name": "pad8",
            //     "typeName": "UNK_TYPE1[8]",
            //     "offset": 0x8,
            // },
        ],
        "size": 0xC
    },
    {
        "name": "Actor",
        "fields": [
            {
                "name": "id",
                "typeName": "s16",
                "offset": 0x000
            },
            {
                "name": "type",
                "typeName": "u8",
                "offset": 0x002,
            },
            {
                "name": "initPosRot",
                "typeName": "PosRot",
                "offset": 0x008,
            },
            {
                "name": "currPosRot",
                "typeName": "PosRot",
                "offset": 0x024,
            },
            {
                "name": "topPosRot",
                "typeName": "PosRot",
                "offset": 0x03C,
            },
            {
                "name": "scale",
                "typeName": "Vec3f",
                "offset": 0x058,
            },
            {
                "name": "velocity",
                "typeName": "Vec3f",
                "offset": 0x064,
            },
            {
                "name": "speedXZ",
                "typeName": "f32",
                "offset": 0x070,
            },
            // {
            // 	"name": "wallPoly",
            // 	"typeName": "BgPolygon*",
            // 	"offset": 0x07C,
            // },
            // {
            // 	"name": "floorPoly",
            // 	"typeName": "BgPolygon*",
            // 	"offset": 0x080,
            // },
            {
                "name": "wallPolySource",
                "typeName": "u8",
                "offset": 0x084,
            },
            {
                "name": "floorPolySource",
                "typeName": "u8",
                "offset": 0x085,
            },

            {
                "name": "parent",
                "typeName": "Actor*",
                "offset": 0x120,
            },
            {
                "name": "child",
                "typeName": "Actor*",
                "offset": 0x124,
            },
            {
                "name": "prev",
                "typeName": "Actor*",
                "offset": 0x128,
            },
            {
                "name": "next",
                "typeName": "Actor*",
                "offset": 0x12C,
            },
            {
                "name": "init",
                "typeName": "actor_func",
                "offset": 0x130,
            },
            {
                "name": "destroy",
                "typeName": "actor_func",
                "offset": 0x134,
            },
            {
                "name": "update",
                "typeName": "actor_func",
                "offset": 0x138,
            },
            {
                "name": "draw",
                "typeName": "actor_func",
                "offset": 0x13C,
            },
            {
                "name": "overlayEntry",
                "typeName": "ActorOverlay*",
                "offset": 0x140,
            },
        ]
    },
    {
        "name": "Vec3f",
        "fields": [
            {
                "name": "x",
                "typeName": "f32",
                "offset": 0x0,
            },
            {
                "name": "y",
                "typeName": "f32",
                "offset": 0x4,
            },
            {
                "name": "z",
                "typeName": "f32",
                "offset": 0x8,
            }
        ],
        "size": 0xC
    },
    {
        "name": "Vec3s",
        "fields": [
            {
                "name": "x",
                "typeName": "s16",
                "offset": 0x0,
            },
            {
                "name": "y",
                "typeName": "s16",
                "offset": 0x2,
            },
            {
                "name": "z",
                "typeName": "s16",
                "offset": 0x4,
            }
        ],
        "size": 0x6
    },
    {
        "name": "PosRot",
        "fields": [
            {
                "name": "pos",
                "typeName": "Vec3f",
                "offset": 0x0,
            },
            {
                "name": "rot",
                "typeName": "Vec3s",
                "offset": 0xC
            },
        ],
    },
    {
        "name": "ActorOverlay",
        "fields": [
            {
                "name": "vromStart",
                "typeName": "u32",
                "offset": 0x00,
            },
            {
                "name": "vromEnd",
                "typeName": "u32",
                "offset": 0x04,
            },
            {
                "name": "vramStart",
                "typeName": "void*",
                "offset": 0x08,
            },
            {
                "name": "vramEnd",
                "typeName": "void*",
                "offset": 0x0C,
            },
            {
                "name": "loadedRamAddr",
                "typeName": "void*",
                "offset": 0x10,
            },
            // 	/* 0x14 */ ActorInit* initInfo;
            {
                "name": "name",
                "typeName": "char*",
                "offset": 0x18,
            }
            // 	/* 0x1C */ u16 allocType; // bit 0: don't allocate memory, use actorContext->0x250? bit 1: Always keep loaded?
            // 	/* 0x1E */ s8 nbLoaded; // original name: "clients"
            // 	/* 0x1F */ UNK_TYPE1 pad1F[0x1];
        ],
        "size": 0x20,
    },


    // needed structs: BgPolygon, actor_func,

];

const basic_sizes = {
    "*": 0x4,
    "f32": 0x4,
    "u32": 0x4,
    "s32": 0x4,
    "s16": 0x2,
    "u16": 0x2,
    "s8": 0x1,
    "u8": 0x1,
    "void*": 0x4,
};

typeMap = {};

// Basic types
typeMap.u8 = new Type("u8", undefined, 1, "getUint8");
typeMap.s8 = new Type("s8", undefined, 1, "getInt8");
typeMap.u16 = new Type("u16", undefined, 2, "getUint16");
typeMap.s16 = new Type("s16", undefined, 2, "getInt16");
typeMap.u32 = new Type("u32", undefined, 4, "getUint32");
typeMap.s32 = new Type("s32", undefined, 4, "getInt32");
typeMap.f32 = new Type("f32", undefined, 4, "getFloat32");
typeMap["char*"] = new Type("char*", undefined, 4, "getUint32");
typeMap["void*"] = new Type("void*", undefined, 4, "getUint32");


// Aliase

type_aliases = {
    "actor_func": "void*", // TODO: FIX shoudl be actor_func, but needs to know it's a poitner!
    "UNK_TYPE1": "u8"
};

Object.keys(type_aliases).forEach(function (alias) {
    typeMap[alias] = typeMap[type_aliases[alias]];
});


// Structs
structTypes.forEach(function (struct) {
    typeMap[struct.name] = new Type(struct.name, struct.fields, struct.size, undefined);
});


function Type(typeName, fields, size, basicReadFunction) {
    this.typeName = typeName;
    this._size = size;

    this.isBasic = false;
    this.isPointer = false;
    this.isArray = false;
    this.isStruct = false;

    if (basicReadFunction !== undefined) {
        this.isBasic = true;
        this.basicReadFunction = basicReadFunction;
    }

    // special bottom types
    if (typeName === "char*" || typeName === "void*") {
        this.name = typeName;
    } else {
        if (typeName.indexOf("[") !== -1) {
            this.isArray = true;
            var open = typeName.indexOf("[");
            var close = typeName.indexOf("]", open);
            this.arrayOfTypeName = typeName.substr(0, open) + typeName.substr(close + 1);
            this.arrayLength = parseInt(typeName.substr(open + 1, close));
        } else if (typeName.indexOf("*") !== -1) {
            this.isPointer = true;
            this.pointsToTypeName = typeName.slice(0, -1);
        } else if (fields !== undefined) {
            var that = this;
            this.isStruct = true;
            // Copy fields
            this.fields = fields.slice();
            this.field = {};

            this.fields.forEach(function (field) {
                that.field[field.name] = field;
                field.type = function () {
                    return getType(field.typeName);
                }
            });
        }
    }

    this.pointsTo = function () {
        return this.isPointer ? getType(this.pointsToTypeName) : undefined;
    };

    this.arrayOf = function () {
        return this.isArray ? getType(this.arrayOfTypeName) : undefined;
    };

    this.size = function () {
        if (this._size === undefined) {
            this._size = type_size(this);
        }
        return this._size;
    }
}


function getType(typeName) {
    if (typeMap[typeName] === undefined) {
        // maybe nonbasic type name, make it
        typeMap[typeName] = new Type(typeName);
    }

    return typeMap[typeName];
}


function argmax(arr, valuefunc) {
    if (arr.length === 0) {
        return -1;
    }

    var max = valuefunc(arr[0]);
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        var val = valuefunc(arr[i])
        if (val > max) {
            maxIndex = i;
            max = val;
        }
    }

    return arr[maxIndex];
}


function type_size(type) {
    if (type.isArray) {
        return type.arrayLength * type.arrayOf().size();
    }
    if (type.isPointer) {
        return 4;
    } else if (type.isStruct) {
        const lastField = argmax(type.fields, function (field) {
            return field.offset;
        });
        return lastField.offset + lastField.type().size();
    } else {
        console.log("type sizing failed", JSON.stringify(type));
    }

    return undefined;
}


module.exports = {
    "typeMap": typeMap,
    "getType": getType
};
