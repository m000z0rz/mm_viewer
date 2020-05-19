const net = require("net");
const _fs = require("fs");

function fakeMemory() {
    const buf = new ArrayBuffer(0xFFFFFFFF);
    return {
        "memory": new DataView(buf),
        "buf": buf
    };
}

const u8 = 'u8', u16 = 'u16', u32 = 'u32',
    s8 = 's8', s16 = 's16', s32 = 's32',
    float = 'float', double = 'double'

function mem(memory, buf) {
    return {
        u8: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getUint8(prop);
                },
                set: function (obj, prop, val) {
                    memory.setUint8(prop, val);
                }
            }),
        u16: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getUint16(prop);
                },
                set: function (obj, prop, val) {
                    memory.setUint16(prop, val);
                }
            }),
        u32: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getUint32(prop);
                },
                set: function (obj, prop, val) {
                    memory.setUint32(prop, val);
                }
            }),
        s8: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getInt8(prop);
                },
                set: function (obj, prop, val) {
                    memory.setUint8(prop, val);
                }
            }),
        s16: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getUint16(prop);
                },
                set: function (obj, prop, val) {
                    memory.setUint16(prop, val);
                }
            }),
        s32: new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getUint32(prop);
                },
                set: function (obj, prop, val) {
                    memory.setUint32(prop, val);
                }
            }),
        'float': new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getFloat32(prop);
                },
                set: function (obj, prop, val) {
                    memory.setFloat32(prop, val);
                }
            }),
        'double': new Proxy({},
            {
                get: function (obj, prop) {
                    return memory.getFloat64(prop);
                },
                set: function (obj, prop, val) {
                    memory.setFloat64(prop, val);
                }
            }),
        getblock: function (address, size) {
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
    const {memory, buf} = fakeMemory();


    return {
        "mem": mem(memory, buf),
        "Server": Server,
        "fs": fs
    }
}