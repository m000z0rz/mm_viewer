//const breakpoints = {}; // {"a": "b"};
const breakpoints = {
    1: {
        "id": 1,
        "type": "read",
        "address": 0x80401111,
        "lastReadFrom": 0x80455555,
        "valueAtLastRead": 576
    }
}

// 4 types of breakpoints: read data, write data, execute, and actor-specific execute
// function breakhere()
// {
//     debug.breakhere();
// }

function makeReadBP(bp)
{
    return function() {
        bp.lastReadFrom = gpr.pc;
        bp.valueAtLastRead = mem.u32[bp.address];
        debug.breakhere();
    };
}

function makeWriteBP(bp)
{
    return function() {
        bp.lastWriteFrom = gp.pc;
        bp.previousValue = mem.u32[bp.address]; // shoudl break before write, so this is value before write
        debug.breakhere();
    };
}

function makeExecBP(bp)
{
    return function () {
        bp.lastRA = gpr.ra; // maybe capture a stack trace in the future
        debug.breakhere();
    };
}

function makeActorSpecificBP(bp, actor)
{
    return function () {
        // arg0 should have pointer to actor
        if (gpr.a0 === actor)
        {
            bp.lastRA = gpr.ra; // maybe capture a stack trace
            debug.breakhere();
        }
    };
}

// Maybe also track the last read / write to things, last ra to exec, etc

function addBreakpoint(type, address, actor)
{
    var callbackId = undefined;
    const bp = {
        "type": type,
        "address": address,
        "actor": actor
    };

    if (type === "read")
    {
        callbackId = events.onread(address, makeReadBP(bp))
    }
    else if (type === "write")
    {
        callbackId = events.onwrite(address, makeWriteBP(bp));
    }
    else if (type === "exec")
    {
        callbackId = events.onexec(address, makeExecBP(bp));
    }
    else if (type === "actor-exec")
    {
        callbackId = events.onexec(address, makeActorSpecificBP(bp, actor));
    }

    bp.id = callbackId;
    breakpoints[callbackId] = bp;

    return bp;
}


function removeBreakpoint(callbackId)
{
    if (breakpoints[callbackId] === undefined)
    {
        return false;
    }

    events.remove(callbackId);
    delete breakpoints[callbackId];
    return true;
}

function getBreakpointsData()
{
    const bps =Object.values(breakpoints);
    bps.forEach(function(bp) {
        if (bp.type === "read" || bp.type === "write")
        {
            bp.value = mem.u32[bp.address];
        }
    });

    return bps;
}

function breakpointCount()
{
    return Object.values(breakpoints).length;
}

module.exports = {
    "breakpoints": breakpoints,
    "breakpointCount": breakpointCount,
    "addBreakpoint": addBreakpoint,
    "removeBreakpoint": removeBreakpoint,
    "getBreakpointsData": getBreakpointsData
}