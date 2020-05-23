const net = require("net");
const _fs = require("fs");

function fakeMemory() {
    const buf = new ArrayBuffer(0xFFFFFFFF);
    return mem(new DataView(buf), buf, 0x00, false);
}

function getUint32(buf, offset)
{
    const dv = new DataView(buf);
    return dv.getUint32(offset, true);
}

function get4bytes(buf, offset)
{
    const dv = new DataView(buf);
    var str = ""
    for (var i = 0; i < 4; i++)
    {
        str += hex(dv.getUint8(offset + i)) + " ";
    }
    return str
}

function hex(num)
{
    const str = num.toString(16).toUpperCase();
    if (str.length % 2 === 0)
    {
        return str;
    }
    else
    {
        return "0" + str;
    }

}

function memoryFromFile(path) {
     const buf = new ArrayBuffer(0xFFFFFFFF);

    const rdram_size = 0x00800000
    const rdram_offset_in_save_state = 0x75C;
    const kseg0 = 0x80000000

    // copy in the cached RDRAM we have to file
    const memory = new Uint8Array(buf, kseg0, rdram_size);
    const filebuf = _fs.readFileSync(path);
    const glooffset = (0x801BD8C0 - 0x80000000);

    for (var j = 0; j < rdram_size; j += 4)
    {
        memory[j + 0] = filebuf[rdram_offset_in_save_state + j + 3];
        memory[j + 1] = filebuf[rdram_offset_in_save_state + j + 2];
        memory[j + 2] = filebuf[rdram_offset_in_save_state + j + 1];
        memory[j + 3] = filebuf[rdram_offset_in_save_state + j + 0];
    }

    return mem(new DataView(buf), buf, 0x00, false);
}

const u8 = 'u8', u16 = 'u16', u32 = 'u32',
    s8 = 's8', s16 = 's16', s32 = 's32',
    float = 'float', double = 'double'

function mem(memory, buf, littleEndian) {
    littleEndian = !!littleEndian;
    return {
        u8: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getUint8(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setUint8(prop, val);
                }
            }),
        u16: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getUint16(prop, littleEndian);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setUint16(prop, val, littleEndian);
                }
            }),
        u32: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getUint32(prop, littleEndian);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setUint32(prop, val, littleEndian);
                }
            }),
        s8: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getInt8(prop);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setUint8(prop, val);
                }
            }),
        s16: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getUint16(prop, littleEndian);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setUint16(prop, val, littleEndian);
                }
            }),
        s32: new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getUint32(prop, littleEndian);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setUint32(prop, val, littleEndian);
                }
            }),
        'float': new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getFloat32(prop, littleEndian);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setFloat32(prop, val, littleEndian);
                }
            }),
        'double': new Proxy({},
            {
                get: function (obj, prop) {
                    prop = parseInt(prop);
                    return memory.getFloat64(prop, littleEndian);
                },
                set: function (obj, prop, val) {
                    prop = parseInt(prop);
                    memory.setFloat64(prop, val, littleEndian);
                }
            }),
        getblock: function (address, size) {
            address = parseInt(address);
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
    const mem = memoryFromFile("saves/s3.pj");

    return {
        "mem": mem,
        "Server": Server,
        "fs": fs
    }
}