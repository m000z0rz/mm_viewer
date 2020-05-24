Promise.all([actorMap(), documentReady])
    .then(function ([actorMap]) {
        const model = m.page;
        const context = {
            "actorMap": actorMap
        };

        buildBreadcrumbs(model.breadcrumbs);

        // If we're at the root, we'll hae a list of global variables. otherwise, we'll have data for something
        if (model.globalVariables) {
            buildGlobalVariables(model.globalVariables);
        } else {
            d3.select("#valueName")
                .text(model.data.name)
                .attr("title", "0x" + model.data.address.toString(16).toUpperCase())
            ;

            buildDataRows(d3.select("#dataTableBody"), model.data, "", context);
        }
    });


function buildGlobalVariables(gvs) {
    gvs = Object.values(gvs)
        .sort((a, b) => d3.ascending(a.offset, b.offset));

    const container = d3.select("#globalVariables");
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
