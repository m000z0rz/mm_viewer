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


function actorDisplayName(actorMap, id) {
    const d = actorMap.get(id);
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
