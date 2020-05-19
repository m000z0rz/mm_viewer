function cmActorList() {
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
    );
}

function documentReady() {
    return $("document").ready().promise;
}


function actorDisplayName(actorMap, id) {
    const d = actorMap.get(id);
    if (d.description !== "") return d.filename + " / " + d.description;
    if (d.translation !== "") return d.filename + " / " + d.translation;

    return d.filename;
}

// some way to also specify whether it's collapsed or not by default?
const valueFormatters = {
    "Actor.id": function (value, parent, context) {
        const cell = d3.select($("div"));
        const id = value.value;
        cell.append("span")
            .text(id + " 0x" + id.toString(16))
        ;

        var displayName = actorDisplayName(context.actorMap, id)
        if (displayName !== "") {
            cell.append("div")
                .append("small")
                .text(displayName)
            ;
        }
        return cell;
    },
    "Vec3f": function (value, parent, context) {
        return d3.select($("div"))
            .text(vectorString(value, 2));
    },
    "Vec3s": function (value, parent, context) {
        return d3.select($("div"))
            .text(vectorString(value, 0));
    },
    "PosRot": function (value, parent, context) {
        return d3.select($("div"))
            .text(vectorString(value.fields.pos, 2) + " and a rot");
    }
};

function vectorString(value, digits)
{
    return "(" + value.fields.x.value.toFixed(digits) + ", "
        + value.fields.y.value.toFixed(digits) + ", "
        + value.fields.z.value.toFixed(digits)
        + ")";
}
