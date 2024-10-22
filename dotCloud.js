/*
To do:
Randomize inputs function
Color controls in GUI (base color, raneg, color palette?)
*/

const canvas = document.getElementById('canvas');
const width = 800;
const height = 800;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');
let t = 0;
// const d = 350;
const TAU = Math.PI * 2;

var animationRequest;
var playAnimationToggle = false;

//detect user browser
var ua = navigator.userAgent;
var isSafari = false;
var isFirefox = false;
var isIOS = false;
var isAndroid = false;
if(ua.includes("Safari")){
    isSafari = true;
}
if(ua.includes("Firefox")){
    isFirefox = true;
}
if(ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")){
    isIOS = true;
}
if(ua.includes("Android")){
    isAndroid = true;
}
console.log("isSafari: "+isSafari+", isFirefox: "+isFirefox+", isIOS: "+isIOS+", isAndroid: "+isAndroid);

var mediaRecorder;
var recordedChunks;
var finishedBlob;
var recordingMessageDiv = document.getElementById("videoRecordingMessageDiv");
var recordVideoState = false;
var videoRecordInterval;
var videoEncoder;
var muxer;
var mobileRecorder;
var videofps = 30;

//add gui
var obj = {
    animationSpeed: 5,
    size: 350,
    dotRadius: 4,
    maxMovement: 30,
    movementRange: 50,
    swirl: 1,
    backgroundColor: '#4a182b',
};

var gui = new dat.gui.GUI( { autoPlace: false } );
//gui.close();
var guiOpenToggle = true;

gui.add(obj, "animationSpeed").min(1).max(20).step(1).name('Animation Speed');
gui.add(obj, "size").min(50).max(400).step(1).name('Size').listen();
gui.add(obj, "dotRadius").min(1).max(15).step(1).name('Dot Radius').listen();
gui.add(obj, "maxMovement").min(1).max(100).step(1).name('Max Movement').listen();
gui.add(obj, "movementRange").min(0).max(100).step(1).name('Movement Range').listen();
gui.add(obj, "swirl").min(0).max(20).step(1).name('Swirl').listen();
gui.addColor(obj, "backgroundColor");

obj['randomizeInputs'] = function () {
  randomizeInputs();
};
gui.add(obj, 'randomizeInputs').name("Randomize Inputs (r)");

obj['playAnimation'] = function () {
    pausePlayAnimation();
};
gui.add(obj, 'playAnimation').name("Play/Pause Animation (p)");

obj['saveImage'] = function () {
    saveImage();
};
gui.add(obj, 'saveImage').name("Save Image (s)");

obj['saveVideo'] = function () {
    toggleVideoRecord();
};
gui.add(obj, 'saveVideo').name("Video Export (v)");

customContainer = document.getElementById( 'gui' );
customContainer.appendChild(gui.domElement);

function project3DTo2D(x, y, z) {
  const base = 5000 / obj.maxMovement;
  const distance = base + (Math.sin(t/2)*base*obj.maxMovement/100);
  // const distance = 300;
  const factor = distance / (distance - z);
  
  return {
    x: canvas.width/2 + x * factor,
    y: canvas.height/2 + y * factor
  };
}

function getColor(x, y, z, t) {
  // Create swirling color effect based on position and time
  const angle = Math.atan2(y, x);
  const dist = Math.sqrt(x*x + y*y);
  
  // Create different color channels based on position and time
  // const base = (50+t)%255;
  const base = 0;
  const range = 500;
  // const r = Math.sin(dist * 0.01 + t) * range + base;
  // const g = Math.sin(angle + t * 2) * range + base;
  // const b = Math.sin(dist * 0.02 - t * 1.5) * range + base;
  
  const r = Math.sin(dist * 0.03 + t + angle*obj.swirl) * range + base;
  const g = r/2;
  const b = r/2;

  // Add wave height influence on brightness
  const brightness = (z + 50) / 100;
  // const brightness = 1;
  const alpha = 0.7;

  return `rgba(${r * brightness}, ${g * brightness}, ${b * brightness}, ${alpha})`;
}

function animate() {
  // ctx.fillStyle = '#4a182b';
  // ctx.fillStyle = '#000000';
  ctx.fillStyle = obj.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const spacing = 10;  // Slightly smaller spacing for more detail
  
  // Create a grid of points
  for(let x = -obj.size; x < obj.size; x += spacing) {
    for(let y = -obj.size; y < obj.size; y += spacing) {
      // Calculate distance from center for radial waves
      const dist = Math.sqrt(x*x + y*y) * 0.015;
      
      // Combine multiple waves for more interesting motion
      const z = Math.sin(dist - t * 2) * 50 * Math.exp(-dist * 0.1) +
               Math.sin(dist * 0.5 + t) * 30 * Math.exp(-dist * 0.1);
      
      const projected = project3DTo2D(x, y, z);
      
      // Get color based on position and wave height
      ctx.fillStyle = getColor(x, y, z, t);
      const radius = Math.max(0, obj.dotRadius + 2*Math.sin(t/5));
      // const radius = 5;
      
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius, 0, TAU);
      ctx.fill();
    }
  }
  
  t += 0.002 * obj.animationSpeed;
  animationRequest = requestAnimationFrame(animate);
}

playAnimationToggle = true;
animate();

//HELPER FUNCTIONS

function randomizeInputs(){
console.log("Randomize inputs");
obj.xStretch = Math.random() * 100;
obj.xSize = Math.random() * 100;
obj.yStretch = Math.random() * 100;
obj.ySize = Math.random() * 100;

if(Math.random() < 0.5) {
obj.movementType = "Wave";
} else {
obj.movementType = "Grid";
}

obj.colorPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)].name;
changePalette();
}

function refreshCanvas(){

console.log("refresh");

if(playAnimationToggle==true){
  playAnimationToggle = false;
  cancelAnimationFrame(animationRequest);
  console.log("cancel animation");
}//cancel any existing animation loops

canvas.width = width;
canvas.height = height;
canvas.scrollIntoView({behavior:"smooth"});
playAnimationToggle = true;
animationRequest = requestAnimationFrame(animate);
}

function pausePlayAnimation(){
console.log("pause/play animation");
if(playAnimationToggle==true){
  playAnimationToggle = false;
  cancelAnimationFrame(animationRequest);
  console.log("cancel animation");
} else {
  playAnimationToggle = true;
  animationRequest = requestAnimationFrame(animate);
}
}

function saveImage(){
const link = document.createElement('a');
link.href = canvas.toDataURL();

const date = new Date();
const filename = `swirl_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.png`;
link.download = filename;
link.click();
}

function toggleGUI(){
if(guiOpenToggle == false){
    gui.open();
    guiOpenToggle = true;
} else {
    gui.close();
    guiOpenToggle = false;
}
}

//shortcut hotkey presses
document.addEventListener('keydown', function(event) {

if (event.key === 'r') {
    randomizeInputs();
} else if (event.key === 's') {
    saveImage();
} else if (event.key === 'v') {
    toggleVideoRecord();
} else if (event.key === 'o') {
    toggleGUI();
} else if(event.key === 'p'){
    pausePlayAnimation();
}

});

function toggleVideoRecord(){
if(recordVideoState == false){
  recordVideoState = true;
  chooseRecordingFunction();
} else {
  recordVideoState = false;
  chooseEndRecordingFunction();
}
}

function chooseRecordingFunction(){
if(isIOS || isAndroid || isFirefox){
    startMobileRecording();
}else {
    recordVideoMuxer();
}
}

function chooseEndRecordingFunction(){
    
if(isIOS || isAndroid || isFirefox){
    mobileRecorder.stop();
}else {
    finalizeVideo();
}

}

//record html canvas element and export as mp4 video
//source: https://devtails.xyz/adam/how-to-save-html-canvas-to-mp4-using-web-codecs-api
async function recordVideoMuxer() {
console.log("start muxer video recording");
var videoWidth = Math.floor(canvas.width/2)*2;
var videoHeight = Math.floor(canvas.height/4)*4; //force a number which is divisible by 4
console.log("Video dimensions: "+videoWidth+", "+videoHeight);

//display user message
recordingMessageDiv.classList.remove("hidden");

recordVideoState = true;
const ctx = canvas.getContext("2d", {
  // This forces the use of a software (instead of hardware accelerated) 2D canvas
  // This isn't necessary, but produces quicker results
  willReadFrequently: true,
  // Desynchronizes the canvas paint cycle from the event loop
  // Should be less necessary with OffscreenCanvas, but with a real canvas you will want this
  desynchronized: true,
});

muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: {
        // If you change this, make sure to change the VideoEncoder codec as well
        codec: "avc",
        width: videoWidth,
        height: videoHeight,
    },

    firstTimestampBehavior: 'offset', 

  // mp4-muxer docs claim you should always use this with ArrayBufferTarget
  fastStart: "in-memory",
});

videoEncoder = new VideoEncoder({
  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  error: (e) => console.error(e),
});

// This codec should work in most browsers
// See https://dmnsgn.github.io/media-codecs for list of codecs and see if your browser supports
videoEncoder.configure({
  codec: "avc1.42003e",
  width: videoWidth,
  height: videoHeight,
  bitrate: 6_000_000,
  bitrateMode: "constant",
});
//NEW codec: "avc1.42003e",
//ORIGINAL codec: "avc1.42001f",

refreshCanvas();
var frameNumber = 0;
//setTimeout(finalizeVideo,1000*videoDuration+200); //finish and export video after x seconds

//take a snapshot of the canvas every x miliseconds and encode to video
videoRecordInterval = setInterval(
    function(){
        if(recordVideoState == true){
            renderCanvasToVideoFrameAndEncode({
                canvas,
                videoEncoder,
                frameNumber,
                videofps
            })
            frameNumber++;
        }else{
        }
    } , 1000/videofps);

}

//finish and export video
async function finalizeVideo(){
console.log("finalize muxer video");
clearInterval(videoRecordInterval);
//playAnimationToggle = false;
recordVideoState = false;

// Forces all pending encodes to complete
await videoEncoder.flush();
muxer.finalize();
let buffer = muxer.target.buffer;
finishedBlob = new Blob([buffer]); 
downloadBlob(new Blob([buffer]));

//hide user message
recordingMessageDiv.classList.add("hidden");

}

async function renderCanvasToVideoFrameAndEncode({
canvas,
videoEncoder,
frameNumber,
videofps,
}) {
let frame = new VideoFrame(canvas, {
    // Equally spaces frames out depending on frames per second
    timestamp: (frameNumber * 1e6) / videofps,
});

// The encode() method of the VideoEncoder interface asynchronously encodes a VideoFrame
videoEncoder.encode(frame);

// The close() method of the VideoFrame interface clears all states and releases the reference to the media resource.
frame.close();
}

function downloadBlob() {
console.log("download video");
let url = window.URL.createObjectURL(finishedBlob);
let a = document.createElement("a");
a.style.display = "none";
a.href = url;
const date = new Date();
const filename = `swirl_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.mp4`;
a.download = filename;
document.body.appendChild(a);
a.click();
window.URL.revokeObjectURL(url);
}

//record and download videos on mobile devices
function startMobileRecording(){
var stream = canvas.captureStream(videofps);
mobileRecorder = new MediaRecorder(stream, { 'type': 'video/mp4' });
mobileRecorder.addEventListener('dataavailable', finalizeMobileVideo);

console.log("start simple video recording");
console.log("Video dimensions: "+canvas.width+", "+canvas.height);

//display user message
//recordingMessageCountdown(videoDuration);
recordingMessageDiv.classList.remove("hidden");

recordVideoState = true;
mobileRecorder.start(); //start mobile video recording

/*
setTimeout(function() {
    recorder.stop();
}, 1000*videoDuration+200);
*/
}

function finalizeMobileVideo(e) {
setTimeout(function(){
    console.log("finish simple video recording");
    recordVideoState = false;
    /*
    mobileRecorder.stop();*/
    var videoData = [ e.data ];
    finishedBlob = new Blob(videoData, { 'type': 'video/mp4' });
    downloadBlob(finishedBlob);
    
    //hide user message
    recordingMessageDiv.classList.add("hidden");

},500);
}