
function hideDisconnectedBadge()
{
    d3.select("#disconnectedBadge")
        .style("display", "none")
    ;
}

function showDisconnectedBadge()
{
    d3.select("#disconnectedBadge")
        .style("display", undefined)
    ;
}


function RepeatingJsonRequest(url, ondata, onerror, requestDelay, reconnectDelay)
{
    requestDelay = requestDelay || 100;
    reconnectDelay = reconnectDelay || 1000;
    let stopped = false;
    let ajax = new XMLHttpRequest();

    ajax.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            hideDisconnectedBadge();
            ondata(this.response);
            setTimeout(doRequest, requestDelay);
        }
    }

    ajax.onerror = function () {
        if (onerror) onerror();
        showDisconnectedBadge();
        // try again after a longer delay
        setTimeout(doRequest, reconnectDelay);
    }

    function doRequest() {
        if (stopped) return;
        ajax.open("GET", url, true);
        ajax.responseType = "json";
        ajax.send();
    }

    doRequest();

    this.stop = function()
    {
        stopped = true;
        ajax.abort();
    };
}




Promise.all([actorMap(), documentReady()])
    .then(function ([actorMap]) {
        const context = {
            "actorMap": actorMap,
            "requestDelay": 100
        };

        const mapRequests = new RepeatingJsonRequest(
            "/map",
            function (response) {
                //document.getElementById("main").innerHTML = this.response.replace(/\n/g, "<br/>", /\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
                const mapData = processMapData(response, context);
                updateMap(mapData, context);
            },
            undefined,
            context.requestDelay
        );
    });


const width = 800, height = 600;
const svg = d3.select("#map")
    .append("svg") //create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", "100%")
    .attr("height", "100%")
;

const g = svg.append("g");

function processMapData(rawData, context)
{
    const actorMap = context.actorMap;
    mapData = rawData.flat();

    // Assign key to each object based on its address in memory and its type id
    mapData.forEach(a => {
        a.key = a.address + "-" + a.id;
        a.displayName = actorDisplayName(actorMap, a.id) || "ID " + hex(a.id);
    });

    return mapData;
}

function updateMap(mapData, context) {

    // array of objects groups, which are arrays of objects
    //console.log("mapData", mapData);

    const [xMin, xMax] = d3.extent(mapData, d => d.currPosRot.pos.x || 0);
    const [yMin, yMax] = d3.extent(mapData, d => d.currPosRot.pos.z || 0);

    if (xMin === xMax || yMin === yMax)
    {
        // nothing (or one thing) exists, skip the update
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
        .data(mapData, d => d.key)
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
        .on("click", d => {
            openActorCard(d, context);
        })
        //.on("mouseover", d => { console.log("mouseover", d); })
    ;

    newCircles
        .append("title")
        .text(d => hex(d.id) + " / " + d.displayName)
    ;

    var t = d3.transition()
        .duration(context.requestDelay)
        .ease(d3.easeLinear)
    ;

    circles.exit()
        .remove();
}

const openActorCards = [];
function openActorCard(d, context)
{
    if (openActorCards.indexOf(a => d.key === d.key) !== -1)
    {
        // TODO: scroll to it
    } else {
        const actorCardData = {
            "key": d.key,
            "address": d.address,
            "id": d.id,
            "displayName": d.displayName,
            "mapData": d,
            "listPath": d.listPath
        };

        openActorCards.push(actorCardData);

        updateActorCards(openActorCards, context);

        //  /data/actorCutscenesGlobalCtxt/actorCtx/actorList/actorList[6]/first/next
        actorCardData.repeatingRequest = new RepeatingJsonRequest(
            "/j/data/actorCutscenesGlobalCtxt/actorCtx/actorList/actorList[" + d.listPath.listIndex + "]/first"
                + "/next".repeat(d.listPath.nextDepth),
            function (response) {
                if (response.fields.id.value !== actorCardData.id)
                {
                    // Looks like the actor went away and was replaced by somethign else; close the card
                    console.log("actor id change, close card");
                    closeActorCard(actorCardData);
                }
                else
                {
                    actorCardData.details = response;
                    // TODO should be more compilcate, detect and mark changes
                    updateActorCards(openActorCards, context);
                }
            }, undefined,
            context.requestDelay
        );


    }
}

function closeActorCard(d)
{
    //const index = openActorCards.findIndex(a => a.key === d.key);
    const index = openActorCards.indexOf(d);
    if (index !== -1)
    {
        openActorCards.splice(index, 1);
        d.repeatingRequest.stop();
        updateActorCards(openActorCards);
    }
}

function updateActorCards(actorCardData, context)
{
    const actorCards = d3.select("#actorSidebar")
        .selectAll(".card")
        .data(actorCardData, d => d.key)
        .order();

    actorCards.exit()
        .style("max-height", function(d) { return this.offsetHeight + "px"; })

        .transition()
        .duration(100)
        .style("max-height", "0px")
        .remove()
    ;

    //actorCards.call(ActorCardsUpdate, context);

    const newCards = actorCards.enter()
        .append("div")
        .classed("card", true)
        .style("margin-top", "1rem")
        .call(ActorCardsEnter, context)
    ;

    actorCards
        .merge(newCards)
        .call(ActorCardsUpdate, context)
        //.order()

    ;

}



function ActorCardsEnter(cards, context)
{
    const cardBodies = cards.append("div")
        .classed("card-body", true)
    ;

    // popout link
    cardBodies.append("a")
        .attr("href",d => "/data/actorCutscenesGlobalCtxt/actorCtx/actorList/actorList[" + d.listPath.listIndex + "]/first"
            + "/next".repeat(d.listPath.nextDepth))
        //.classed("float-left", true)

        .append("i")
        .classed("fas", true)
        .classed("fa-external-link-alt", true)
    ;

    cardBodies.append("button")
        .attr("type", "button")
        .classed("close", true)
        .classed("float-right", true)
        .attr("aria-label", "Close")
        .on("click", d => {
            closeActorCard(d);
        })

        .append("span")
        .attr("aria-hidden", true)
        .html("&times;")
    ;




    cardBodies.append("h5")
        .classed("card-title", true)
    ;

    cardBodies.append("h6")
        .classed("card-subtitle", true)
        .classed("mb-2", true)
        .classed("text-muted", true)
    ;

    cardBodies.append("div")
        .style("max-height", "300px")
        .style("overflow-y", "scroll")

        .append("table")
        .classed("table", true)
        .classed("table-sm", true)
        .style("font-size", "0.8rem")

        .append("tbody")
    ;
}

function ActorCardsUpdate(cards, context)
{
    // Title
    cards.select(".card-body > .card-title")
        .text(d => d.displayName)
    ;

    // Subtitles
    cards.select(".card-body > .card-subtitle")
        .text(d => hex(d.address))
    ;

    cards.select(".card-body > div > table > tbody")
        .call(updateDataTable, context)
        //updateDataTable(d => d.details)
    ;


}




function updateDataTable(tbodies, context)
{
    tbodies.each(function(d) {
        if (d.details !== undefined)
        {
            buildDataRows(d3.select(this), d.details, context);
        }

    })
    // console.log("updateDataTable", tbodies, d);
    // const data = d.details;
    // if (data !== undefined)
    // {
    //     console.log("updateDataTable", data);
    // }
    //data = data || [];


}

