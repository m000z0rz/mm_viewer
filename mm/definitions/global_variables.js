const types = makeshift_require("./Scripts/mm/definitions/types.js");
console.log("gv include types", types);
const globals = [
    {
        "name": "actorCutscenesGlobalCtxt",
        "offset": 0x801BD8C0,
        "typeName": "GlobalContext*",
    }
];

const global_variables = {
    "byName": {},
    "byOffset": {},
};

globals.forEach(function(glo) {
    global_variables.byName[glo.name] = glo;
    global_variables.byOffset[glo.offset] = glo;
    glo.type = function() { console.log("glo type", types); return types.getType(glo.typeName); };
});

module.exports = global_variables;