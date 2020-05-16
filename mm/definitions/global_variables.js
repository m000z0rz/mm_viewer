console.log("ga");

const globals = [
  {
      "name": "actorCutscenesGlobalCtxt",
      "offset": 0x801BD8C0,
      "typeName": "GlobalContext*",
      "type": {
        "name": "*",
        "pointsTo": "GlobalContext",
      },
    }
];

const global_variables = {
  "byName": {},
  "byOffset": {},
};

console.log("gb");
globals.forEach(function(glo) {
  global_variables.byName[glo.name] = glo;
  global_variables.byOffset[glo.offset] = glo;
});

modules.exports = global_variables;

console.log("gc");