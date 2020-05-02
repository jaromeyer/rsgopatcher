const inputElement = document.getElementById("input");
const patchButton = document.getElementById("patchBtn");
const downloadBtn = document.getElementById("downloadBtn");
patchButton.style.display = "none";
downloadBtn.style.display = "none";
inputElement.addEventListener("change", handleFiles, false);

function handleFiles() {
    patchButton.style.display = "none";
    downloadBtn.style.display = "none";
    var file = this.files[0];
    if (file.type == "video/mp4") {
        filename = file.name
        reader = new FileReader();
        reader.onload = function () {
            patchButton.style.display = "inline";
        }
        reader.readAsArrayBuffer(file);
    } else {
        alert("invalid file format")
    }
}

function patch() {
    var bytes = new Uint8Array(reader.result);
    var angle = document.getElementById("angle").value * Math.PI / 180;
    patchButton.style.display = "none";

    // loop over batches
    for (var i = 0; i < bytes.byteLength; i++) {
        if (bytes[i] == 0x41 && bytes[i + 1] == 0x43 && bytes[i + 2] == 0x43 && bytes[i + 3] == 0x4c && bytes[i + 4] == 0x73) {
            var sampleCount = bytes[i + 6] << 8 | bytes[i + 7]

            // loop over samples of a batch
            for (var j = 0; j < sampleCount; j++) {
                let index = i + j * 6 + 8

                // read original values
                var x = toInt16Bytes(bytes[index], bytes[index + 1]); // front/back
                var y = toInt16Bytes(bytes[index + 2], bytes[index + 3]); // left/right
                var z = toInt16Bytes(bytes[index + 4], bytes[index + 5]); // down/up

                // calculate new values
                var xNew = Math.round(x * Math.sin(angle) + y * Math.cos(angle));
                var yNew = z; // correct
                var zNew = Math.round(x * Math.cos(angle) - y * Math.sin(angle));

                console.log("x: " + xNew + " y: " + yNew + " z: " + zNew);

                // save the new values
                bytes[index] = xNew >> 8;
                bytes[index + 1] = xNew;
                bytes[index + 2] = yNew >> 8;
                bytes[index + 3] = yNew;
                bytes[index + 4] = zNew >> 8;
                bytes[index + 5] = zNew;
            }
        }
    }

    // make download
    var output = new Blob([bytes], { type: 'video / mp4' });
    downloadBtn.href = URL.createObjectURL(output);
    downloadBtn.download = filename.slice(0, -4) + "_patched.MP4";
    downloadBtn.style.display = "inline";
}

// convert two bytes to a big-endian signed integer
function toInt16Bytes(byteA, byteB) {
    var sign = byteA & (1 << 7);
    var result = (((byteA & 0xFF) << 8) | (byteB & 0xFF));
    if (sign) {
        result = 0xFFFF0000 | result;
    }
    return result;
}