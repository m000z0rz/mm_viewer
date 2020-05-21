const net = require("net");
const _fs = require("fs");

function fakeMemory() {
    const buf = new ArrayBuffer(0xFFFFFFFF);
    return {
        "memory": new DataView(buf),
        "buf": buf,
        "offset": 0
    };
}

function memoryFromFile(path) {
    // const buf = new ArrayBuffer(0xFFFFFFFF);
    // const arr = new Uint8Array(buf.buffer, buf.byteOffset, buf.length);

    // copy in the cached RDRAM we aved to file
    //const memory = new Uint8Array(buf);
    //const saved = new Uint8Array(_fs.readFileSync(path));
    // const saved = new _fs.readFileSync(path);
    // arr.set(saved, 0x80000000, 0x0020000);
    const buf = _fs.readFileSync(path).buffer;

    return {
        "memory": new DataView(buf),
        "buf": buf,
        "offset": 0x80000000

    };

}

const u8 = 'u8', u16 = 'u16', u32 = 'u32',
    s8 = 's8', s16 = 's16', s32 = 's32',
    float = 'float', double = 'double'

function mem(memory, buf, offset) {
    offset = offset || 0;
    return {
        u8: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getUint8(prop + offset);
                },
                set: function (obj, prop, val) {
                    memory.setUint8(prop + offset, val);
                }
            }),
        u16: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getUint16(prop + offset);
                },
                set: function (obj, prop, val) {
                    memory.setUint16(prop + offset, val);
                }
            }),
        u32: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop) + offset;
                    return memory.getUint32(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop) + offset;
                    memory.setUint32(prop, val);
                }
            }),
        s8: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop) + offset;
                    return memory.getInt8(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop) + offset;
                    memory.setUint8(prop, val);
                }
            }),
        s16: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop) + offset;
                    return memory.getUint16(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop) + offset;
                    memory.setUint16(prop, val);
                }
            }),
        s32: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop) + offset;
                    return memory.getUint32(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop) + offset;
                    memory.setUint32(prop, val);
                }
            }),
        'float': new Proxy({},
            {
                get: function (obj, prop) {
                    console.log("float", prop, offset, parseInt(prop) + offset);
                    prop = parseInt(prop) + offset;
                    return memory.getFloat32(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop) + offset;
                    memory.setFloat32(prop, val);
                }
            }),
        'double': new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop) + offset;
                    return memory.getFloat64(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop) + offset;
                    memory.setFloat64(prop, val);
                }
            }),
        getblock: function (address, size) {
            address = parseInt(address) + offset;
            return buf.slice(address, address + size);
        }
        // getstring: function(address, maxLen)
        // {
        //     return _native.getRDRAMString(address, maxLen)
        // },
    }
}


// function Server(settings)
// {
//     var _this = this;
//     var _fd = _native.sockCreate()
//     var _fd = net.Socket();
//     var _listening = false;
//     var _queued_accept = false;
//
//     var _onconnection = function(socket){}
//
//     this.listen = function (port) {
//         if (_native.sockListen(_fd, port || 80)) {
//             _listening = true;
//         } else {
//             throw new Error("failed to listen");
//         }
//
//         if (_queued_accept) {
//             _native.sockAccept(_fd, _acceptClient);
//         }
//     }
//
//     if(settings.port)
//     {
//         this.listen(settings.port || 80);
//     }
//
//     // Intermediate callback
//     //  convert clientFd to Socket and accept next client
//     var _acceptClient = function(clientFd)
//     {
//         _onconnection(new Socket(clientFd))
//         _native.sockAccept(_fd, _acceptClient)
//     }
//
//     this.on = function(eventType, callback)
//     {
//         switch(eventType)
//         {
//             case 'connection':
//                 _onconnection = callback;
//                 if (_listening) {
//                     _native.sockAccept(_fd, _acceptClient);
//                 } else {
//                     _queued_accept = true;
//                 }
//                 break;
//         }
//     }
// }

function Server(settings) {
    const innerServer = net.createServer();
    innerServer.on("error", (err) => {
        throw err;
    });
    var _onconnection = function(socket){}

    innerServer.on("connection", function(client)
    {
        _onconnection(client);
    }); // can we get away with just passing through the socket?

    this.listen = function (port) {
        innerServer.listen(port);
    };

    if (settings.port) {
        this.listen(settings.port || 80);
    }

    this.on = function (eventType, callback) {
        switch (eventType) {
            case "connection":
                _onconnection = callback;
                break;
        }
    }
}

const fs = {
    readFile: function readFile(path) {
        return _fs.readFileSync(path); //, {"flag": flag});
    }
}

module.exports = function api(saveStateFilename) {
    const {memory, buf, offset} = fakeMemory();
    //const {memory, buf, offset} = memoryFromFile("savestate.bin");


    return {
        "mem": mem(memory, buf, -offset),
        "Server": Server,
        "fs": fs
    }
}