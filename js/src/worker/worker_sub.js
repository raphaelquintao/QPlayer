self.font  = null;

self.onmessage = function (e) {
    var text     = e.data.text;
    var textSett = e.data.textSett;

    if (self.font === null) self.font = new THREE.Font(textSett.font.data);

    textSett.font = self.font;

    var lines = text.split("\n");

    var buffers = [];

    for (var c in lines) {
        var tempGeo = new THREE.TextBufferGeometry(lines[c], textSett);
        tempGeo.center();

        var vertices = tempGeo.attributes.position.array;
        var normals  = tempGeo.attributes.normal.array;

        buffers[c] = {
            "vertices": vertices,
            "normals":  normals
        };
    }

    postMessage({"buffers": buffers});
};