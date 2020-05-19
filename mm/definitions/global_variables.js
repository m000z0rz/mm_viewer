const types = makeshift_require(basePath + "/mm/definitions/types.js");
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
    glo.type = function() { return types.getType(glo.typeName); };
});

module.exports = global_variables;