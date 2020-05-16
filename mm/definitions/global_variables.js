const globals = [
  {
      "name": "actorCutscenesGlobalCtxt",
      "offset": 0x801BD8C0,
      "type": {
        "name": "*",
        "pointsTo": "GlobalContext",
      },
    }
];

global_variables = {
  "byName": {},
  "byOffset": {},
};

globals.forEach(function(glo) {
  global_variables.byName[glo.name] = glo;
  global_variables.byOffset[glo.offset] = glo;
});

modules.exports = global_variables;