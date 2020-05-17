$(document).ready(function() {
   console.log("data ready");
   console.log("m?", m);

   const gvs = Object.values(m);
   gvs.sort((a, b) => d3.ascending(a.offset, b.offset));

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




});