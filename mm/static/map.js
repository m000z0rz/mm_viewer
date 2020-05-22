var requestDelay = 100;

Promise.all([actorMap(), documentReady()])
    .then(function ([actorMap]) {
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                d3.select("#disconnectedBadge")
                    .style("display", "none")
                ;

                //document.getElementById("main").innerHTML = this.response.replace(/\n/g, "<br/>", /\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
                drawPositions(JSON.parse(this.response), actorMap);
                setTimeout(doRequest, requestDelay);
            }
        }

        ajax.onerror = function () {
            d3.select("#disconnectedBadge")
                .style("display", undefined)
            ;

            // try again in a bit
            setTimeout(doRequest, 1000);
        }

        function doRequest() {
            ajax.open("GET", "http://localhost:7777/map", true);
            ajax.responseType = "text";
            ajax.send();
        }

        doRequest();
    });


const width = 800, height = 600;
const svg = d3.select("#map")
    .append("svg") //create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", "100%")
    .attr("height", "100%")
;

const g = svg.append("g");

function drawPositions(data, actorMap) {
    // array of objects groups, which are arrays of objects
    console.log("data", data);


    data = data.flat();

    // Assign key to each object based on its address in memory and its type id
    data.forEach(a => {
        a.key = a.address + "-" + a.id;
    });

    const [xMin, xMax] = d3.extent(data, d => d.currPosRot.pos.x || 0);
    const [yMin, yMax] = d3.extent(data, d => d.currPosRot.pos.z || 0);

    if (xMin === xMax || yMin === yMax)
    {
        // nothign exists, skip the update
        return;
    }

    const viewPadding = 50;
    const xWidth = xMax - xMin;
    const yHeight = yMax - yMin;
    svg.attr("viewBox", [
        xMin - viewPadding, yMin - viewPadding, xWidth + viewPadding * 2, yHeight + viewPadding * 2
    ]);

    const radii = {
        16: 15 // make tatl smaller
    };

    const fillColors = {
        0: "green", // link
        387: "pink", // deku flower
        16: "beige", // tatl
    };

    const circles = g.selectAll("circle")
        .data(data, d => d.key)
    ;

    circles
        .transition(t)
        .attr("cx", d => d.currPosRot.pos.x)
        .attr("cy", d => d.currPosRot.pos.z)
    ;

    newCircles = circles.enter()
        .append("circle")
        .attr("r", d => radii[d.id] || 20)
        .style("stroke-width", 3)
        .style("stroke", "black")
        .style("fill", d => fillColors[d.id] || "grey")
        .attr("cx", d => d.currPosRot.pos.x)
        .attr("cy", d => d.currPosRot.pos.z)
        .style("cursor", "pointer")
        .on("click", d => { console.log(d); })
        .on("mouseover", d => { console.log("mouseover", d); })
    ;

    newCircles
        .append("title")
        .text(d => "0x" + d.id.toString(16) + " / " + actorDisplayName(actorMap, d.id))
    ;

    var t = d3.transition()
        .duration(requestDelay)
        .ease(d3.easeLinear)
    ;

    circles.exit()
        .remove();
}

const openActorCards = [];
function openActorCard(d)
{

}

function closeActorCard(d)
{

}


