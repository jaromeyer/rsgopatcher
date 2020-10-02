var chunkSize = 1024 * 1024 * 1024; // 1 GB
var chunks = [];
var reader = new FileReader();
var file;
var angle;
var orientation;

onmessage = function (e) {
    file = e.data[0];
    angle = e.data[1];
    orientation = e.data[2];
    readChunk(0);
}

function patch() {
    // loop over chunks
    for (var k = 0; k < chunks.length; k++) {
        var chunk = chunks[k];
        // loop over batches of a chunk
        for (var i = 0; i < chunk.length - 4; i++) {
            if (chunk[i] == 0x41 && chunk[i + 1] == 0x43 && chunk[i + 2] == 0x43 && chunk[i + 3] == 0x4c && chunk[i + 4] == 0x73) {
                // update progress
                postMessage(["Patching ", (i + (k * chunkSize)) / file.size * 100]);
                var sampleCount = chunk[i + 6] << 8 | chunk[i + 7];
                if (sampleCount < 200) {
                    // loop over samples of a batch
                    for (var j = 0; j < sampleCount; j++) {
                        var index = i + j * 6 + 8
                        // read original values
                        var x = toInt16Bytes(chunk[index], chunk[index + 1]); // front/back
                        var y = toInt16Bytes(chunk[index + 2], chunk[index + 3]); // left/right
                        var z = toInt16Bytes(chunk[index + 4], chunk[index + 5]); // down/up

                        if (orientation == "umma") {
                            var xNew = Math.round(y * Math.cos(angle) - x * Math.sin(angle));
                            var yNew = z;
                            var zNew = Math.round(x * Math.cos(angle) + y * Math.sin(angle));
                        } else if (orientation == "flat") {
                            var xNew = Math.round(-z * Math.cos(angle) + x * Math.sin(angle));
                            var yNew = y;
                            var zNew = Math.round(x * Math.cos(angle) + z * Math.sin(angle));
                        } else if (orientation == "vertical") {
                            var xNew = Math.round(-x * Math.cos(angle) - y * Math.sin(angle));
                            var yNew = -z;
                            var zNew = Math.round(-y * Math.cos(angle) + x * Math.sin(angle));
                        }
                        // save the new values
                        chunk[index] = xNew >> 8;
                        chunk[index + 1] = xNew;
                        chunk[index + 2] = yNew >> 8;
                        chunk[index + 3] = yNew;
                        chunk[index + 4] = zNew >> 8;
                        chunk[index + 5] = zNew;
                    }
                }
            }
        }
    }
    console.log("Successfully patched");
    var output = new Blob(chunks, { type: 'video / mp4' });
    postMessage(output);
}

// convert two bytes (big-endian) into a 16-bit signed integer
function toInt16Bytes(byteA, byteB) {
    var sign = byteA & (1 << 7);
    var result = (((byteA & 0xFF) << 8) | (byteB & 0xFF));
    if (sign) {
        result = 0xFFFF0000 | result;
    }
    return result;
}

function readChunk(start) {
    var end = start + chunkSize;
    var chunk = file.slice(start, end);
    reader.onload = function (event) {
        // add new chunk to the chunks array
        chunks.push(new Uint8Array(event.target.result));
        postMessage(["Loading ", end / file.size * 100]);
        if (end < file.size) { // still data left
            // update progress and load next chun
            console.log("Successfully loaded chunk");
            readChunk(end);
        } else { // upload complete
            // logging and status update
            console.log("Successfully loaded file");
            patch();
        }
    }
    reader.readAsArrayBuffer(chunk);
}