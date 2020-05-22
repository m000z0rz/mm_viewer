
// Promises ///////////////////////////////////////////////////////////////////

function actorMap() {
    return d3.tsv(
        "/static/cm_actor_list.tsv",
        function tsv_parse_row(d) {
            return {
                id: parseInt(d.id, 16),
                filename: d.filename,
                objectID: parseInt(d.objectID, 16),
                translation: d.translation,
                description: d.description,
                used: d.used
            }
        }
    ).then(function (cmActorList) {
        return d3.map(cmActorList, d => d.id)
    });
}

function documentReady() {
    return $("document").ready().promise;
}


// Utility ////////////////////////////////////////////////////////////////////

function hex(number)
{
    var hexed = number.toString().toUpperCase();
    if (hexed.length % 2 === 1)
    {
        hexed = "0" + hexed;
    }

    return "0x" + hexed;
}




// Value Formatting ///////////////////////////////////////////////////////////

function actorDisplayName(actorMap, id) {
    const d = actorMap.get(id);
    if (d === undefined)
    {
        return undefined;
    }

    if (d.description !== "") return d.filename + " / " + d.description;
    if (d.translation !== "") return d.filename + " / " + d.translation;

    return d.filename;
}

// some way to also specify whether it's collapsed or not by default?
const valueFormatters = {
    "Actor.id": function (td, value, parent, context) {
        console.log("context", context);
        console.log(arguments);
        const id = value.value;
        td.append("span")
            .text(id + " 0x" + id.toString(16))
        ;

        var displayName = actorDisplayName(context.actorMap, id)
        if (displayName !== "") {
            td.append("div")
                .append("small")
                .text(displayName)
            ;
        }
    },
    "Vec3f": function (td, value, parent, context) {
        td.text(vectorString(value, 2));
    },
    "Vec3s": function (td, value, parent, context) {
        td.text(vectorString(value, 0));
    },
    "PosRot": function (td, value, parent, context) {
        td.text(vectorString(value.fields.pos, 2) + " " + rotationString(value.fields.rot, 2));
    }
};

function vectorString(value, digits) {
    return "(" + (value.fields.x.value || 0).toFixed(digits) + ", "
        + (value.fields.y.value || 0).toFixed(digits) + ", "
        + (value.fields.z.value || 0).toFixed(digits)
        + ")";
}

function rotationToAngle(rot) {
    return ((rot || 0) / 32768 * 360)
}

function rotationString(value, digits) {
    return "(" + rotationToAngle(value.fields.x.value).toFixed(digits) + ","
        + rotationToAngle(value.fields.y.value).toFixed(digits) + ","
        + rotationToAngle(value.fields.z.value).toFixed(digits)
        + ")";
}




// Fields table ///////////////////////////////////////////////////////////////
function buildDataRows(tbody, data, context) {
    // Roll up the hierarchical data to a flat array that we can build trs with
    var startDepth = 0;
    if (data.values || data.fields) {
        startDepth = -1;
    }

    const flatData = rollupData(data, "", startDepth, "", false);

    const rows = tbody.selectAll("tr")
        .data(flatData, d => d.path)
        .order()
    ;

    var newRows = rows.enter()
        .append("tr")
    ;

    var nameCells = newRows.append("th")
        .html(d => "&nbsp;&nbsp;".repeat(d.depth))
    ;

    nameCells
        .append("span")
        .text(d => d.name)
        .attr("title", d => d.typeName + " @ 0x" + d.address.toUpperCase())

    // Value cells
    newRows.append(d => makeValueCell(d, context));


    // breakpoint stuff will go here
    newRows.append("td")
        .text("o")
    ;

}

function makeValueCell(d, context) {
    const td = d3.select(document.createElement("td"));

    const parentTypeFormatter = valueFormatters[d.parentType + "." + d.name];
    const typeFormatter = valueFormatters[d.typeName];
    if (parentTypeFormatter !== undefined) {
        parentTypeFormatter(td, d.value, undefined, context);
    } else if (typeFormatter !== undefined) {
        typeFormatter(td, d.value, undefined, context);
    } else if (d.typeName.endsWith("*")) {
        if (d.value.value === 0) {
            td.text("NULL");
        } else {
            td.append("a")
                .attr("href", d.path)
                .text("0x" + d.value.value.toString(16).toUpperCase())
            ;
        }
    } else if (d.value.value === undefined) {
        td.text(d.typeName);
    } else {
        td.text(d.value.value);
    }

    return td.node();
}


function rollupData(d, prefix, depth, parentType, includeParent) {
    includeParent = includeParent ?? true;
    var parent = [];

    if (d.values) {
        // array
        parent = [];
        if (includeParent) {
            parent = [
                {
                    "name": d.name,
                    "path": includeParent ? prefix + "/" + d.name : d.name,
                    "address": d.address,
                    "typeName": d.typeName,
                    "parentType": parentType,
                    "value": d,
                    "depth": depth
                }
            ];
        }
        return parent.concat(d.values.flatMap(val =>
            rollupData(
                val,
                prefix === "" ? d.name : prefix + "/" + d.name,
                depth + 1,
                d.typeName.replace("*", "").replace("[]", ""),
                true
            )
        ));
    } else if (d.fields) {
        // object
        parent = [];
        if (includeParent) {
            parent = [
                {
                    "name": d.name,
                    "path": includeParent ? prefix + "/" + d.name : d.name,
                    "address": d.address,
                    "typeName": d.typeName,
                    "parentType": parentType,
                    "value": d,
                    "depth": depth
                }
            ];
        }
        return parent.concat(
            d3.values(d.fields)
                .sort((a, b) => d3.ascending(parseInt(a.address, 16), parseInt(b.address, 16)))
                .flatMap(field =>
                    rollupData(
                        field,
                        prefix === "" ? d.name : prefix + "/" + d.name,
                        depth + 1,
                        d.typeName.replace("*", "").replace("[]", ""),
                        true
                    )
                )
        );

    } else {
        return [{
            "name": d.name,
            "path": prefix + "/" + d.name,
            "address": d.address,
            "typeName": d.typeName,
            "parentType": parentType,
            "value": d,
            "depth": depth
        }];
    }
}

function buildBreadcrumbs(data) {
    // data is [{fieldName, path}]
    data = [{"fieldName": "Global Variables", "path": "/"}].concat(data);

    const items = d3.select("#breadcrumbs")
        .selectAll("li.breadcrumb-item")
        .data(data)
    ;

    items.enter()
        .append("li")
        .classed("breadcrumb-item", true)

        .append("a")
        .text(d => d.fieldName)
        .attr("href", d => "/data" + d.path)
    ;
}
