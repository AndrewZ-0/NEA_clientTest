import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {Cube, Cylinder, Sphere, Torus} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {calculateScaledFidelity} from "../AGRE/src/utils/renderProperties.js";


function returnToWorkbench() {
    const projectName = communicator.getProjNameFromUrl();
    window.location.href = `projectWorkbench.html?project=${projectName}`;
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", returnToWorkbench);

let ge;
let simConfig = {};
let objectHeaders;
let frames = [];

function parseFramesString(framesString) {
    const lines = framesString.trim().split("\n");

    const headers = lines[0].split(" "); //first line always contains the object headers

    const frames = [];

    for (let i = 1; i < lines.length; i++) {
        let frame = [];
        const values = lines[i].trim().split(" ");
        for (let j = 0; j < values.length; j += 6) {
            let object = [];
            for (let k = j; k < j + 6; k++) {
                object.push(parseFloat(values[k]));
            }
            frame.push(object);
        }
        frames.push(frame);
    }

    return {headers, frames};
}


async function loadData() {
    const projectName = communicator.getProjNameFromUrl();
    const simulationName = communicator.getSimNameFromUrl();
    console.log("Opening simulation:", `${projectName}::${simulationName}`);
    
    document.getElementById("titlebar-simulation-name").textContent = `${projectName}::${simulationName}`;

    const projectData = await communicator.getSimulationData(projectName, simulationName);

    if (projectData.status !== "OK") {
        console.error("Failed to load project data:", projectData.message);
        return;
    }

    simConfig = projectData.data.simConfig;



    //const projectData = await communicator.getSimulationFrames(projectName, simulationName);
    const frameFileStreamResponse = await communicator.streamSimulationFramesFile(projectName, simulationName);

    if (frameFileStreamResponse.status !== "OK") {
        console.error("Failed to stream simulaiton frames:", frameFileStreamResponse.message);
        return;
    }


    const response = parseFramesString(frameFileStreamResponse.frames);

    objectHeaders = response.headers;
    frames = response.frames;

    console.log(simConfig);
    //console.log(frames);

    //frames = projectData.data.frames;

    //console.log(frames);
    let objects = [];
    for (let objectName in simConfig.objects) {
        if (simConfig.objects[objectName]["dtype"] === 0) {
            const obj = simConfig.objects[objectName];

            let colour = obj["colour"];

            const radius = obj["radius"];
            const fidelity = calculateScaledFidelity(radius, 240);

            objects.push(new Sphere(objectName, ...obj["position"], radius, fidelity, colour)); 
        }
    }

    ge = new GraphicsEngine(objects);
    ge.start();


    updateProgressBar(0); 
    updateTiming(0, frames.length);
}


let currentFrame = 0;
let isPaused = true;

function playSimulationFrame() {
    if (!frames || frames.length === 0 || isPaused) {
        togglePause();
        return;
    }

    const noOfObject = objectHeaders.length;
    const frame = frames[currentFrame];

    for (let i = 0; i < noOfObject; i++) {
        const objectData = frame[i];
        const objectName = objectHeaders[i];

        const object = masterRenderer.objects[i];
        object.x = objectData[0];
        object.y = objectData[1];
        object.z = objectData[2];
    }

    // Update progress and time
    updateProgressBar(((currentFrame + 1) / frames.length) * 100);
    updateTiming((currentFrame + 1), frames.length);

    currentFrame += 5;

    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();

    if (currentFrame < frames.length) {
        requestAnimationFrame(playSimulationFrame);
    }
}

async function startSimulation() {
    if (isPaused) {
        isPaused = false;
        togglePause();
        requestAnimationFrame(playSimulationFrame);
    }
}

function pauseSimulation(event) {
    isPaused = true;
    togglePause();
}

function togglePause() {
    if (isPaused) {
        document.getElementById("pauseButton").classList.add("hidden");
        document.getElementById("playButton").classList.remove("hidden");
    } 
    else {
        document.getElementById("pauseButton").classList.remove("hidden");
        document.getElementById("playButton").classList.add("hidden");
    }
}

document.getElementById("playButton").addEventListener("pointerdown", startSimulation);
document.getElementById("pauseButton").addEventListener("pointerdown", pauseSimulation);


function updateProgressBar(progress) {
    const progressBar = document.getElementById("simulationProgressBar-progress");
    progressBar.style.width = `${progress}%`;
}

function updateTiming(currentTime, totalTime) {
    const timeEntry = document.getElementById("time-entry");
    timeEntry.textContent = `${formatTime(currentTime)} / ${formatTime(totalTime)}`;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}



async function setupPlayer() {
    const response = await communicator.loginFromSessionStorage();
    if (response.status === "ERR") {
        //console.error("Automatic login failed");
        location.href = "login.html";
        return;
    }

    loadData();
}

setupPlayer();