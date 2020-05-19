const _fs = require("fs");
const path = require("path");
const {
    mem,
    Server,
    fs
} = require("./fake_api.js")("nofilenameyet");

const mm_script = _fs.readFileSync("../../mm.js").toString();
Server.hack_basePath = "."
process.chdir("../..");
eval(mm_script);
