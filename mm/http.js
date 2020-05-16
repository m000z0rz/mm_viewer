

// util

function objectFromEntries(entries)
{
    var obj = {};
    entries.forEach(function(entry) { obj[entry[0]] = entry[1]; });
    return obj;
}





// http stuff
const httpResponseType = {
    200: "OK",
    404: "Not Found"
};

const extensionToMimeType = {
    "html": "text/html",
    "json": "application/json",
    "tsv": "text/tab-separated-values"
};

function fileResponse(client, path, contentType, callback)
{
    if (contentType === undefined) {
        const ext = path.lastIndexOf(".");
        const extension = path.substr(ext + 1);
        contentType = extensionToMimeType[extension] || "text/plain";
    }

    const buffer = fs.readFile(path);
    if (!buffer)
    {
        httpResponse(client, "404", "text/plain", 404);
    }
    else
    {
        httpResponse(client, buffer.toString(), contentType, 200, callback);
    }
}


function jsonResponse(client, obj, callback)
{
    httpResponse(client, JSON.stringify(obj), "application/json", 200, callback);
}

function httpResponse(client, data, contentType, code, callback)
{
    code = code || 200;
    contentType = contentType || "text/plain";
    callback = callback || function() { };

    if (httpResponseType[code] === undefined)
    {
        throw new Error("Bad http response code " + code);
    }

    client.write(
        "HTTP/1.1 " + code + " " + httpResponseType[code] + "\r\n"
        + "Content-type: " + contentType + "\r\n"
        + "Content-length: " + data.length + "\r\n"
        + "Access-Control-Allow-Origin: *\r\n"
        + "\r\n"
        + data
        ,callback
    );
}


function parseHttpRequest(data)
{
    // expect data is buffer
    var prev = 0;
    var i = 0;
    i = data.indexOf(" ");
    const method = data.slice(prev, i).toString();
    prev = i + 1;

    if (method !== "GET")
    {
        console.log("Fail to handle non-GET request " + method);
        return undefined;
    }

    i = data.indexOf(" ", prev);
    const path = data.slice(prev, i).toString();
    prev = i + 1;

    i = data.indexOf("\n", prev);
    prev = i + 1;

    headersText = data.slice(prev).toString();

    const headers = parseHeaders(headersText);

    // TODO: should parse URI params here and include on request details (alongside full path)
    return {
        path: path,

        headers: headers
    };
}

function parseHeaders(headersText)
{
    var headerLines = headersText.split("\n");
    return objectFromEntries(
        headerLines
            .filter(function(l) { return l.trim() !== ""; })
            .map(function(l) { return parseHeader(l); })
            .filter(function(l) { return l !== undefined; })
    );
}

function parseHeader(headerLine)
{
    const i = headerLine.indexOf(": ");
    if (i === -1)
    {
        return undefined;
    }

    return [headerLine.substr(0, i), headerLine.substr(i + 2)];
}



function parseURIParams(path)
{
    path = decodeURIComponent(path);
    const paramStart = path.indexOf("?");
    const params = {};
    if (paramStart !== -1)
    {
        path = path.substr(0, paramStart);

        const paramAssignments = path.substr(paramStart + 1).split("&");
        paramAssignments.forEach(function(assignment) {
            const equals = assignment.indexOf("=");
            params[assignment.substr(0, equals)] = params[assignment.substr(equals + 1)];
        })
    }

    return {
        "path": path,
        "params": params
    };
}


module.exports = {
    "fileResponse": fileResponse,
    "jsonResponse": jsonResponse,
    "httpResponse": httpResponse,
    "parseHttpRequest": parseHttpRequest,
    "parseURIParams": parseURIParams,
};