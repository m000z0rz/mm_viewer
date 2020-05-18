$(document).ready(function() {
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
function buildData(data)
{
   // outer thing data
   d3.select("#valueName")
       .textContent(data.name)
   ;

   // so here I think I need to do different stuff depending on whether data is
   //  for array/struct (has values/fields) or not
   //  probably shouldn't ever be pointer (server will just follow through to value)
   //  but it could be a basic value, which would be handled differently
   //if (data.)
   d3.select("#dataTableBody")
       .selectAll("tr")
       .data()

   ;
}

function buildBreadcrumbs(data)
{
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
