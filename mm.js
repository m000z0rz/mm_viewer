var server = new Server({port: 7777});

// const variables = {
// 	"actorCutscenesGlobalCtxt": {
// 		"typestr": "GlobalContext*",
// 		"type": "pointer",
// 		"pointerType": "GlobalContext"
// 		"offset": 0x801BD8C0
// 	}
// }

// const structs = {
// 	"GlobalContext": {
// 		"fields": {
// 			"cameraCtx": {
// 				"type": "CameraContext",
// 				"offset": 0x0020
// 			},
// 			"actorCtx": {
// 				"type": "ActorContext",
// 				"offset": 0x01CA0
// 			}
// 		}
// 	},
// 	"ActorContext": {
// 		"fields": {
// 			"actorList": {
// 				"typestr": "ActorListEntry[12]",
// 				"type": "array",
// 				"arrayOf": "ActorListEntry",
// 				"offset": 0x010
// 			}
// 		}
// 	},
// 	"ActorListEntry": {
// 		"fields": {
// 			"length": {
// 				"type": "s32",
// 				"offset": 0x0
// 			},
// 			"first": {
// 				"type": "pointer",
// 				"pointerType": "Actor"
// 			},
// 			"pad8": {
// 				"type": "array",
// 				"arrayOf": "UNK_TYPE1",
// 				"offset": 0x8
// 			}
// 		}
// 	},
// 	"Actor": {
// 		"fields": {
// 			"id": {
// 				"type": "s16",
// 				"offset": 0x000
// 			},
// 			"type": {
// 				"type": "u8",
// 				"offset": 0x002
// 			}
// 		}
// 	}
// 	"s32": {
// 		// atomic!
// 	}
// }

server.on('connection', function(client)
{
	client.on('data', function(data)
	{
		try {
			const request = parseHttpRequest(data.toString());
			processGetRequest(client, request);
		}
		catch (ex) {
			console.log("exception ", ex);
		}
	});
});

function processGetRequest(client, request)
{
	const path = request.path;
	const headers = request.headers;
	if (path === "/" )
	{
		console.log("index");

		var buffer = fs.readFile("./Scripts/mm/index.html");
		console.log(buffer.toString());
		console.log(fs.readdir("."));
		client.write(
			"HTTP/1.1 200 OK\r\n"
			+ "Content-type: text/html\r\n"
			+ "Access-Control-Allow-Origin: *\r\n"
			+ "Content-length: " + buffer.length + "\r\n"
			+ "\r\n"
			+ buffer.toString()
			,function () {

			}
		);

		client.write(buffer);
		console.log("index done");
	}
	else if (path === "/test")
	{
		//console.log("process request with path ", path, " and headers ", headers);
		var obj = getData();
		respondWithJSON(client, obj);
	}

}














// ************************* UTIL ******************************

function objectFromEntries(entries)
{
	var obj = {};
	entries.forEach(function(entry) { obj[entry[0]] = entry[1]; });
	return obj;
}











// ************************* HTTP ****************************

function respondWithJSON(client, object)
{
	var str = JSON.stringify(object);
	client.write(
		"HTTP/1.1 200 OK\r\n"
			+ "Content-type: application/json\r\n"
			+ "Access-Control-Allow-Origin: *\r\n"
			+ "Content-length: " + str.length + "\r\n"
			+ "\r\n"
			+ str
		,function () {
			// finished write
		}
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

















// **************************** MM *******************************************

function getData()
{
	var globalContextAddress = mem.u32[0x801BD8C0];
	var actorContextAddress = globalContextAddress + 0x01CA0;
	var actorListEntriesTableAddress = actorContextAddress + 0x10;


	mem.f32 = mem.float;
	mem.f64 = mem.double;

	ret = [];

	for (var i = 0; i < 12; i++)
	{
		var actorListEntryAddress = actorListEntriesTableAddress + 0xC * i;
		var actorCount = mem.s32[actorListEntryAddress];
		if (actorCount == 0)
			continue;

		var actorAddress = mem.u32[actorListEntryAddress + 0x4];

		objs = [];
		//str += actorCount + " of:\n";
		for (var actorIndex = 0; actorIndex < actorCount; actorIndex++)
		{
			var actor = makeActor(actorAddress)
			objs.push(actor);
				
			actorAddress = mem.u32[actorAddress + 0x12C]; // next
		}

		ret.push(objs);
	}

	return ret;
};

function makeActor(actorAddress)
{
	var id = mem.u16[actorAddress + 0x00];
	var currPosRotAddress = actorAddress + 0x24;
	var speedXZ = mem.f32[actorAddress + 0x70];
	var sqDistanceFromLink = mem.f32[actorAddress + 0x98];
	var textId = mem.u16[actorAddress + 0x116];
	

	if (id === 649)
	{
		//mem.f32[currPosRotAddress + 0x4] += 10.0;
		mem.s16[currPosRotAddress + 0xC + 0x2] += 100.0;
	}

	return {
		id: id,
		currPosRot: makeCurrPosRot(currPosRotAddress),
		speedXZ: speedXZ,
		sqDistanceFromLink: sqDistanceFromLink,
		textId: textId
	};
}

function makeCurrPosRot(address)
{
	return {
		pos: makeVec3f(address + 0x0),
		rot: makeVec3s(address + 0xC)
	};
}

function makeVec3f(address)
{
	return {
		x: mem.f32[address + 0x0],
		y: mem.f32[address + 0x4],
		z: mem.f32[address + 0x8]
	};
}

function makeVec3s(address)
{
	return {
		x: mem.s16[address + 0x0],
		y: mem.s16[address + 0x2],
		z: mem.s16[address + 0x4]
	};
}

function Vec3fToString(address)
{
	var x = mem.f32[address + 0x0];
	var y = mem.f32[address + 0x4];
	var z = mem.f32[address + 0x8];
	return ("(" + x + ", " + y + ", " + z + ")");
}

function Vec3sToString(address)
{
	var x = mem.s16[address + 0x0];
	var y = mem.s16[address + 0x2];
	var z = mem.s16[address + 0x4];
	return "(" + x + ", "  + y + ", " + z + ")";	
}

function PosRotToString(address)
{
	return Vec3fToString(address + 0x0) + ", " + Vec3sToString(address + 0xC);
}


// PosRot is 0x0 Vec3f pos, 0xC Vec3s rot; Vec3f is 0x0, 0x04, 0x8 f32 x y z, Vec3s is s16 0x0, 0x2, 0x4

//mem.bindvar(this, 0x801BD8C0, 'lpGlobalContext', u32);
