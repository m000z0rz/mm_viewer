var requestDelay = 100;

Promise.all([documentReady(), cmActorList()])
    .then(function (_, cmActorList) {
        const actorMap = d3.map(cmActorList, d => d.id);

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
    //console.log("data", data);

    // Assign key to each object based on their type id and index within their group

    // Skip link in early data; we only use the camera one
    data.forEach(group => {
        group.forEach((obj, index) => {
            obj.key = obj.id + ":" + index;
        });
    });

    data = data.flat();

    //console.log("newdata", data);
    //console.log("links", data.filter(d => d.id === 0).map(d => "(" + d.currPosRot.pos.x + ", " + d.currPosRot.pos.z + ")"));
    const viewMinX = d3.min(data, d => d.currPosRot.pos.x - 20) || 0;
    const viewMinY = d3.min(data, d => d.currPosRot.pos.z - 20) || 0;
    const viewMaxX = d3.max(data, d => d.currPosRot.pos.x + 20) || 0;
    const viewMaxY = d3.max(data, d => d.currPosRot.pos.z + 20) || 0;

    if (viewMinX === viewMaxX || viewMinY === viewMaxY) {
        // nothing exists, skip the update, may have just died
        return;
    }

    svg.attr("viewBox", [
        viewMinX, viewMinY, viewMaxX - viewMinX, viewMaxY - viewMinY
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

