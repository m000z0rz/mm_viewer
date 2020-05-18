$(document).ready(function () {
    console.log("data ready");
    console.log("m?", m);

    var model = m.page;

    buildBreadcrumbs(model.breadcrumbs);

    // If we're at the root, we'll hae a list of global variables. otherwise, we'll have data for something
    if (model.globalVariables) {
        buildGlobalVariables(model.globalVariables);
    } else {
        buildData(model.data);
    }
});

function buildGlobalVariables(gvs) {
    gvs = Object.values(gvs)
        .sort((a, b) => d3.ascending(a.offset, b.offset));

    const container = d3.select("#globalVariables");
    console.log("container", container);
    console.log("gvs?", gvs);
    const links = container.selectAll("span.nav-link").data(gvs);

    //<span class="nav-link" href>Link <a href="'#">ssltekshe</a> asdf</span>

    newLinks = links.enter()
        .append("span")
        .classed("nav-link", true)
    ;

    newLinks.append("small")
        .text(d => " 0x" + d.offset.toString(16).toUpperCase())
    ;

    newLinks.append("span")
        .text(d => " " + d.typeName + " ")
    ;

    newLinks.append("a")
        .text(d => d.name)
        .attr("href", d => "/data/" + d.name)
    ;

}


/*
basic and pointer:
{
   "value": dv[type.basicReadFunction](),
   "typeName": type.typeName,
   "name": name,
   "address": address.toString(16)
};

struct:
{
   "typeName": type.typeName,
   "fields": {},
   "fieldDefinitions": type.fields,
   "name": name,
   "address": address.toString(16)
}

array:
{
   "values": [],
   "typeName": type.typeName,
   "name": name,
   "address": address.toString(16)
}
 */
function buildData(data) {
    // outer thing data
    d3.select("#valueName")
        .text(data.name)
        .attr("title", "0x" + data.address.toString(16).toUpperCase())
    ;

    const tbody = d3.select("#dataTableBody")
    ;

    // Roll up the hierarchical data to a flat array that we can build trs with
    var startDepth = 0;
    if (data.values || data.fields) {
        startDepth = -1;
    }
    const flatData = rollupData(data, "", startDepth, false);
    console.log("flatData", flatData);

    const rows = tbody.selectAll("tr")
        .data(flatData, d => d.path)
        .order()
    ;

    var newRows = rows.enter()
        .append("tr")
    ;

    newRows.append("th")
        .html(d => "&nbsp;&nbsp;".repeat(d.depth) + d.name)
        .attr("title", d => d.typeName + " @ 0x" + d.address.toUpperCase())


    var valueCells = newRows.append("td");

    var pointerValueCells = valueCells.filter(d => d.typeName.endsWith("*"));

    pointerValueCells.filter(d => d.value === "0")
        .text(d => "NULL")
        ;

    pointerValueCells.filter(d => d.value !== "0")
        .append("a")
        .attr("href", d => d.path)
        .text(d => "0x" + d.value.toString(16).toUpperCase())
    ;

    valueCells.filter(d => !d.typeName.endsWith("*"))
        .text(d => d.value)
    ;

    newRows.append("td")
        .text("o")
    ;

}


function rollupData(d, prefix, depth, includeParent) {
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
                    "value": undefined,
                    "depth": depth
                }
            ];
        }
        return parent.concat(d.values.flatMap(val =>
            rollupData(val, prefix === "" ? d.name : prefix + "/" + d.name, depth + 1, true)
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
                    "value": undefined,
                    "depth": depth
                }
            ];
        }
        return parent.concat(
            d3.values(d.fields)
                .sort((a, b) => d3.ascending(parseInt(a.address, 16), parseInt(b.address, 16)))
                .flatMap(field =>
                    rollupData(field, prefix === "" ? d.name : prefix + "/" + d.name, depth + 1, true)
                )
        );

    } else {
        return [{
            "name": d.name,
            "path": prefix + "/" + d.name,
            "address": d.address,
            "typeName": d.typeName,
            "value": d.value,
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
        .attr("href", d => "/data/" + d.path)
    ;
}
