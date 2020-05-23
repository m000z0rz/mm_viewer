
Promise.all([documentReady()])
    .then(function () {
        const model = m.page;
        console.log("bp model", model);

        const byType = d3.nest()
            .key(bp => bp.type)
            .map(model)
        ;

        const typeTitles = {
            "read": "Read",
            "write": "Write",
            "exec": "Execute",
            "actor-exec": "Actor-specific Execute"
        };

        updateRead(byType.get("read") || []);

    });

function updateRead(bps)
{
    const rows = d3.select("#readTableBody")
        .selectAll("tr")
        .data(bps, bp => bp.id)
    ;

    console.log("bps", bps, "rows", rows);

    rows.exit().remove();

    const newRows = rows.enter()
        .append("tr")
    ;

    console.log("newRows", newRows);

    for (var i = 0; i < 5; i++)
    {
        newRows.append("td");
    }
    // newRows
    //     .append("td")
    //     .append("td")
    //     .append("td")
    //     .append("td")
    //     .append("td")
    // ;

    const updateRows = rows.merge(newRows);

    updateRows
        .select("td:nth-child(2)")
        .text(d => hex(d.address))
    ;

    updateRows
        .select("td:nth-child(3)")
        .text(d => hex(d.value))
    ;

    updateRows
        .select("td:nth-child(4)")
        .text(d => hex(d.valueAtLastRead))
    ;

    updateRows
        .select("td:nth-child(5)")
        .text(d => hex(d.lastReadFrom))

}
