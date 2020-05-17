const inputElement = document.getElementById("input");
const patchButton = document.getElementById("patchBtn");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const progBar = document.getElementById("progBar");
var file;

// status init
patchButton.disabled = true;
downloadBtn.style.display = "none";
inputElement.addEventListener("change", handleFiles, false);

function handleFiles() {
    downloadBtn.style.display = "none";
    status.innerHTML = "Ready"
    file = this.files[0];
    if (file.type == "video/mp4") {
        patchButton.disabled = false;
    } else {
        patchButton.disabled = true;
        console.log("Invalid file format");
        alert("Invalid file format")
    }
}

function patch() {
    console.log("Starting patching process");
    patchButton.disabled = true;

    var angle = document.getElementById("angle").value * Math.PI / 180;
    var mounting = document.getElementById("mounting").value;
    var patcher = new Worker('patcher.js');
    patcher.postMessage([file, angle, mounting]);

    patcher.onmessage = function (e) {
        if (e.data instanceof Blob) {
            downloadBtn.href = URL.createObjectURL(e.data);
            downloadBtn.download = file.name.slice(0, -4) + "_patched.MP4";
            downloadBtn.style.display = "inline";
            progBar.style.width = "100%";
            status.innerHTML = "Finished";
            console.log("Successfully generated download link");
        } else {
            // update progress
            status.innerHTML = e.data[0] + file.name;
            progBar.style.width = e.data[1] + "%";
        }
    }
}