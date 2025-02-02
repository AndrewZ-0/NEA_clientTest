import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {updateSelectedOverlay} from "../AGRE/src/core/overlays.js";
import {Cube, Cylinder, Sphere, Torus} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {bindAllControls, unbindAllKeyControls, quickReleaseKeys} from "../AGRE/src/core/listeners.js";
import {calculateScaledFidelity} from "../AGRE/src/utils/renderProperties.js";



let ge;
let projectData = {"deltaT": null, "noOfFrames": null, "objects": {}};
let settingsData = {};

function returnToDashboard(event) {
    location.href = "projectDashboard.html";
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", returnToDashboard);

function simulationMenuKeyEvents(event) {
    if (event.key === "Escape") {
        const simulationList = document.getElementById("simulationList");
        simulationList.value = "";
        updateSimulationButtons();
    }
}

function showPlaySimulationMenu(event) {
    quickReleaseKeys();

    unbindAllKeyControls();
    document.getElementById("playSimulationMenu-overlay").classList.remove("hidden");

    loadSimulations();
    document.addEventListener("keydown", simulationMenuKeyEvents);

    validateSimulaitonConfigEntrys();
}

function hidePlaySimulationMenu(event) {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    bindAllControls(ge.canvas);
    document.getElementById("playSimulationMenu-overlay").classList.add("hidden");
    document.removeEventListener("keydown", simulationMenuKeyEvents);
}

document.getElementById("playButton").addEventListener("pointerdown", showPlaySimulationMenu);
document.getElementById("hide-playSimulationMenu-overlay-button").addEventListener("pointerup", hidePlaySimulationMenu);

function updateSimulationButtons() {
    const simulationList = document.getElementById("simulationList");

    const openSimulationButton = document.getElementById("openSimulation");
    const deleteSimulationButton = document.getElementById("deleteSimulation");
    const renameSimulationButton = document.getElementById("renameSimulation");

    if (simulationList.value !== "") {
        openSimulationButton.disabled = false;
        deleteSimulationButton.disabled = false;
        renameSimulationButton.disabled = false;

        openSimulationButton.addEventListener("pointerdown", openSimulation);
        deleteSimulationButton.addEventListener("pointerdown", deleteSimulation);
        renameSimulationButton.addEventListener("pointerdown", renameSimulation);
    }
    else {
        openSimulationButton.disabled = true;
        deleteSimulationButton.disabled = true;
        renameSimulationButton.disabled = true;

        openSimulationButton.removeEventListener("pointerdown", openSimulation);
        deleteSimulationButton.removeEventListener("pointerdown", deleteSimulation);
        renameSimulationButton.removeEventListener("pointerdown", renameSimulation);
    }
}

document.getElementById("simulationList").addEventListener("change", updateSimulationButtons);

async function loadSimulations() {
    const projectName = communicator.getProjNameFromUrl();
    const response = await communicator.list_project_simulations(projectName);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to load simulations: ${response.message}`;
        return;
    }

    const simulationList = document.getElementById("simulationList");
    simulationList.replaceChildren();

    for (const simulation of response.data) {
        const option = document.createElement("option");
        option.value = simulation;
        option.textContent = simulation;
        simulationList.appendChild(option);
    }

    updateSimulationButtons();
}

async function deleteSimulation() {
    const simulationList = document.getElementById("simulationList");
    const selectedSimulation = simulationList.value;
    const projectName = communicator.getProjNameFromUrl();

    const response = await communicator.deleteSimulation(projectName, selectedSimulation);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to delete simulation: ${response.message}`;
        return;
    }

    loadSimulations();
}

async function renameSimulation() {
    const simulationList = document.getElementById("simulationList");
    const selectedSimulation = simulationList.value;
    const newSimulationName = prompt("Enter new simulation name:");
    const projectName = communicator.getProjNameFromUrl();

    const response = await communicator.renameSimulation(projectName, selectedSimulation, newSimulationName);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to rename simulation: ${response.message}`;
        return;
    }

    loadSimulations();
}

document.getElementById("computeNewSimulationButton").addEventListener("pointerdown", createAndComputeNewSimulation);

function openSimulation() {
    const simulationList = document.getElementById("simulationList");
    const selectedSimulation = simulationList.value;
    const projectName = communicator.getProjNameFromUrl();

    window.location.href = `simulationPlayer.html?project=${projectName}&simulation=${selectedSimulation}`;
}

async function loadData() {
    const projectName = communicator.getProjNameFromUrl();
    
    document.getElementById("titlebar-project-name").textContent = projectName;

    const projectResponse = await communicator.getProjectData(projectName);

    if (projectResponse.status !== "OK") {
        console.error("Failed to load project data:", projectResponse.message);
        return;
    }

    document.getElementById("projectDataMenu-projectName").textContent = projectName;
    document.getElementById("project-creation-date").textContent = projectResponse.data.creationDate;

    if (Object.keys(projectResponse.data.simConfig).length > 0) {
        projectData = projectResponse.data.simConfig;
    }

    settingsData = projectResponse.data.settings; //will use this later
    let objects = [];
    for (let objectName in projectData.objects) {
        if (projectData.objects[objectName]["dtype"] === 0) {
            const obj = projectData.objects[objectName];

            let colour = obj["colour"];

            const radius = obj["radius"];
            const fidelity = calculateScaledFidelity(radius);

            objects.push(new Sphere(objectName, ...obj["position"], radius, fidelity, colour)); 
        }
    }

    ge = new GraphicsEngine(objects, true);
    ge.start();
}

function showProjectDataMenu() {
    document.getElementById("projectDataMenu").classList.remove("hidden");
    document.getElementById("titlebar-project-name").removeEventListener("pointerdown", showProjectDataMenu);
    document.getElementById("titlebar-project-name").addEventListener("pointerdown", hideProjectDataMenu);

}

function hideProjectDataMenu() {
    document.getElementById("projectDataMenu").classList.add("hidden");
    document.getElementById("titlebar-project-name").removeEventListener("pointerdown", hideProjectDataMenu);
    document.getElementById("titlebar-project-name").addEventListener("pointerdown", showProjectDataMenu);
}

document.getElementById("titlebar-project-name").addEventListener("pointerdown", showProjectDataMenu);


let currentSelection = null;
function toggleTab(tabId) {
    const tab = document.getElementById(tabId + "Tab");
    const tabMenu = document.getElementById(tabId + "Menu");
    const overlays = document.getElementById("overlays");

    if (tabId === currentSelection) {
        tab.classList.remove("focus");
        tabMenu.classList.add("hidden");

        overlays.style.left = "0px";

        currentSelection = null;   
    }
    else {
        if (currentSelection !== null) {
            document.getElementById(currentSelection + "Tab").classList.remove("focus");
            document.getElementById(currentSelection + "Menu").classList.add("hidden");
        }
        else {
            overlays.style.left = "120px";
        }

        tab.classList.add("focus");
        tabMenu.classList.remove("hidden");

        currentSelection = tabId;
    }
}

//probably should fix this later to make it less vomit enducing to look at...
document.getElementById("toolsTab").addEventListener("pointerup", () => toggleTab("tools"));
document.getElementById("modelsTab").addEventListener("pointerup", () => toggleTab("models"));
document.getElementById("cameraTab").addEventListener("pointerup", () => toggleTab("camera"));
document.getElementById("shadersTab").addEventListener("pointerup", () => toggleTab("shaders"));


function createObjectOverlayKeyEvents(event) {
    if (event.key === "Escape") {
        hideCreateObjectOverlay();
    } 
    else if (event.key === "Enter") {
        createObject();
    }
}

function workbenchKeyEvents(event) {
    //legacy stuff: backspace used to be here for deleting objects
}

document.getElementById("createObject-button").addEventListener("pointerup", createObject);


function showCreateObjectOverlay() {
    quickReleaseKeys();

    unbindAllKeyControls();
    document.removeEventListener("keydown", workbenchKeyEvents);
    document.getElementById("createObject-overlay").classList.remove("hidden");
    document.addEventListener("keydown", createObjectOverlayKeyEvents); 

    fillObjectNameOnCreateObjectOverlay();
}

function hideCreateObjectOverlay() {
    const errorMessageDiv = document.getElementById("createObject-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    document.getElementById("objectName").value = "";

    document.getElementById("createObject-overlay").classList.add("hidden");
    document.removeEventListener("keydown", createObjectOverlayKeyEvents);

    bindAllControls(ge.canvas);

    document.addEventListener("keydown", workbenchKeyEvents);
}

function hexToVec3(colourHex) {
    const r = parseInt(colourHex.slice(1, 3), 16) / 255;
    const g = parseInt(colourHex.slice(3, 5), 16) / 255;
    const b = parseInt(colourHex.slice(5, 7), 16) / 255;

    return [r, g, b];
}

function vec3ToHex(colourVec3) {
    const r = Math.round(colourVec3[0] * 255).toString(16).padStart(2, "0");
    const g = Math.round(colourVec3[1] * 255).toString(16).padStart(2, "0");
    const b = Math.round(colourVec3[2] * 255).toString(16).padStart(2, "0");

    return "#" + r + g + b;
}

let unsavedChanges = false;
function markUnsavedChanges() {
    if (!unsavedChanges) {
        const badge = document.querySelector("#saveProjectButton .badge");
        badge.classList.remove("hidden");
        unsavedChanges = true;
    }
}
function clearUnsavedChanges() {
    if (unsavedChanges) {
        const badge = document.querySelector("#saveProjectButton .badge");
        badge.classList.add("hidden");
        unsavedChanges = false;
    }
}

function createObject() {
    const name = document.getElementById("objectName").value;

    if (name in projectData.objects) {
        const errorMessageDiv = document.getElementById("createObject-error-message");
        errorMessageDiv.textContent = "Object name is taken.";
        return;
    }

    const objectType = document.getElementById("objectType").value;

    if (! validateCreateObjectEntries()) {
        return;
    }

    let newObject;
    if (objectType === "0") {
        const position = {
            x: parseFloat(document.getElementById("position-x").value),
            y: parseFloat(document.getElementById("position-y").value),
            z: parseFloat(document.getElementById("position-z").value)
        };
        const velocity = {
            x: parseFloat(document.getElementById("velocity-x").value),
            y: parseFloat(document.getElementById("velocity-y").value),
            z: parseFloat(document.getElementById("velocity-z").value)
        };

        const radius = parseFloat(document.getElementById("radius").value);
        const mass = parseFloat(document.getElementById("mass").value);
        const colour = hexToVec3(document.getElementById("colour").value);

        const fidelity = calculateScaledFidelity(radius);
        newObject = new Sphere(name, position.x, position.y, position.z, radius, fidelity, colour);

        projectData.objects[name] = {
            dtype: 0,
            position: [position.x, position.y, position.z],
            velocity: [velocity.x, velocity.y, velocity.z],
            radius, mass, colour
        };
    } 
    
    //plane not implemented yet
    /*
    else if (objectType === "1") {
        newObject = new Plane("newPlane", position.x, position.y, position.z, radius, colour);
    }*/

    masterRenderer.objects.push(newObject);
    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();

    markUnsavedChanges();
    hideCreateObjectOverlay();
}

function validateCreateObjectEntries() {
    const errorMessageDiv = document.getElementById("createObject-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    const name = document.getElementById("objectName").value;

    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(name)) {
        errorMessageDiv.textContent = `Object name (${name}) is invalid. Only characters (A-Z, a-z, _ and 0-9) are allowed`;
        return;
    } 

    const axes = ["x", "y", "z"];

    for (const axis of axes) {
        const val = parseFloat(document.getElementById(`position-${axis}`).value);
        if (isNaN(val)) {
            errorMessageDiv.textContent = `Position (${axis}) value must be a float.`;
            return false;
        }
    }

    for (const axis of axes) {
        const val = parseFloat(document.getElementById(`velocity-${axis}`).value);
        if (isNaN(val)) {
            errorMessageDiv.textContent = `Velocity (${axis}) value must be a float.`;
            return false;
        }
    }

    const radius = parseFloat(document.getElementById("radius").value);
    if (isNaN(radius) || radius <= 0) {
        errorMessageDiv.textContent = "Radius must be a non-zero positive integer.";
        return false;
    }

    const mass = parseFloat(document.getElementById("mass").value);
    if (isNaN(mass) || mass <= 0) {
        errorMessageDiv.textContent = "Mass must be a non-zero positive integer.";
        return false;
    }

    return true;
}

document.getElementById("objectName").addEventListener("input", validateCreateObjectEntries);
document.getElementById("position-x").addEventListener("input", validateCreateObjectEntries);
document.getElementById("position-y").addEventListener("input", validateCreateObjectEntries);
document.getElementById("position-z").addEventListener("input", validateCreateObjectEntries);
document.getElementById("velocity-x").addEventListener("input", validateCreateObjectEntries);
document.getElementById("velocity-y").addEventListener("input", validateCreateObjectEntries);
document.getElementById("velocity-z").addEventListener("input", validateCreateObjectEntries);
document.getElementById("radius").addEventListener("input", validateCreateObjectEntries);
document.getElementById("mass").addEventListener("input", validateCreateObjectEntries);
document.getElementById("colour").addEventListener("input", validateCreateObjectEntries);



function fillObjectNameOnCreateObjectOverlay() {
    const currName = document.getElementById("objectName").value;

    if (currName === "") {
        let NewName = "Unnamed";

        if (NewName in projectData.objects || NewName.toLowerCase() in projectData.objects) {
            let i = 2;
            while (NewName + i in projectData.objects || NewName.toLowerCase() + i in projectData.objects) {
                i++;
            }

            NewName += i;
        }

        document.getElementById("objectName").value = NewName;
    }
    
}

function deleteObject() {
    if (masterRenderer.currentSelection !== null) {
        const name = masterRenderer.objects[masterRenderer.currentSelection].name;
        delete projectData.objects[name];

        masterRenderer.objects.splice(masterRenderer.currentSelection, 1);
        masterRenderer.currentSelection = null;

        toggleObjectDataMenu();

        masterRenderer.quickInitialise(masterRenderer.objects);
        ge.quickAnimationStart();

        updateSelectedOverlay();
        markUnsavedChanges();
    }
}

function recordObjectMovement(event) {
    const movedObject = event.detail;

    projectData.objects[movedObject.name].position = [movedObject.x, movedObject.y, movedObject.z];

    populateObjectDataForm(movedObject);

    markUnsavedChanges();
}

function populateObjectDataForm(object) {
    const errorMessageDiv = document.getElementById("editObject-error-message");
    errorMessageDiv.textContent = "";
    document.getElementById("edit-objectName").value = object.name;
    
    let dtype;
    if (projectData.objects[object.name].dtype === 0) {
        dtype = "Particle";
    }
    else {
        dtype = "Plane"
    }
    document.getElementById("edit-objectType").value = dtype;

    document.getElementById("edit-position-x").value = object.x;
    document.getElementById("edit-position-y").value = object.y;
    document.getElementById("edit-position-z").value = object.z;
    document.getElementById("edit-velocity-x").value = projectData.objects[object.name].velocity[0];
    document.getElementById("edit-velocity-y").value = projectData.objects[object.name].velocity[1];
    document.getElementById("edit-velocity-z").value = projectData.objects[object.name].velocity[2];
    document.getElementById("edit-radius").value = projectData.objects[object.name].radius;
    document.getElementById("edit-mass").value = projectData.objects[object.name].mass;
    document.getElementById("edit-colour").value = vec3ToHex(projectData.objects[object.name].colour);
}

function updateObjectData() {
    const errorMessageDiv = document.getElementById("editObject-error-message");
    errorMessageDiv.textContent = "";

    const selectedObject = masterRenderer.objects[masterRenderer.currentSelection];

    const name = document.getElementById("edit-objectName").value;

    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(name)) {
        errorMessageDiv.textContent = `Object name (${name}) is invalid. Only characters (A-Z, a-z, _ and 0-9) are allowed`;
        return;
    } 

    const axes = ["x", "y", "z"];

    let position = {};
    for (const axis of axes) {
        const inp = document.getElementById(`edit-position-${axis}`);
        const val = parseFloat(inp.value);
        if (isNaN(val)) {
            errorMessageDiv.textContent = `Position (${axis}) must be a float`;
            return;
        }
        position[axis] = val
    }

    let velocity = {};
    for (const axis of axes) {
        const inp = document.getElementById(`edit-velocity-${axis}`);
        const val = parseFloat(inp.value);
        if (isNaN(val)) {
            errorMessageDiv.textContent = `Velocity (${axis}) must be a float`;
            return;
        }
        velocity[axis] = val
    }

    const radiusInp = document.getElementById("edit-radius");
    const radius = parseFloat(radiusInp.value);
    if (isNaN(radius) || radius <= 0) {
        errorMessageDiv.textContent = "Radius must be a positive non-zero float";
        return;
    }

    const massInp = document.getElementById("edit-mass");
    const mass = parseFloat(massInp.value);
    if (isNaN(mass) || mass <= 0) {
        errorMessageDiv.textContent = "Mass must be a positive non-zero float";
        return;
    }

    const fidelity = calculateScaledFidelity(radius);

    const colour = hexToVec3(document.getElementById("edit-colour").value);

    const oldObjectName = selectedObject.name;
    const oldDtype = projectData.objects[oldObjectName].dtype;

    //update view data
    selectedObject.name = name;
    selectedObject.x = position.x;
    selectedObject.y = position.y;
    selectedObject.z = position.z;
    selectedObject.radius = radius;
    selectedObject.colour = colour;
    selectedObject.fidelity = fidelity;

    //update model data
    if (oldObjectName !== name) {
        delete projectData.objects[oldObjectName];
        projectData.objects[name] = {};
    }
    projectData.objects[name].position = [position.x, position.y, position.z];
    projectData.objects[name].velocity = [velocity.x, velocity.y, velocity.z];
    projectData.objects[name].radius = radius;
    projectData.objects[name].mass = mass;
    projectData.objects[name].colour = colour;
    projectData.objects[name].dtype = oldDtype;

    //masterRenderer.objects[masterRenderer.currentSelection] = selectedObject;

    //masterRenderer.currentSelection = name;

    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();

    markUnsavedChanges();
}

function toggleObjectDataMenu(event) {
    const orientationViewport = document.getElementById("orientationViewport-surface");
    const workbenchDataMenu = document.getElementById("workbenchDataMenu");

    if (masterRenderer.currentSelection !== null) {
        orientationViewport.style.right = "250px";
        workbenchDataMenu.classList.remove("hidden");
        populateObjectDataForm(event.detail);
    } 
    else {
        orientationViewport.style.right = "0px"; 
        workbenchDataMenu.classList.add("hidden");
    }
}

function exitObjectDataMenu(event) {
    const orientationViewport = document.getElementById("orientationViewport-surface");
    const workbenchDataMenu = document.getElementById("workbenchDataMenu");

    orientationViewport.style.right = "0px"; 
    workbenchDataMenu.classList.add("hidden");
}

document.getElementById("exitObjectDataMenu-button").addEventListener("pointerup", exitObjectDataMenu)

document.addEventListener("objectSelected", toggleObjectDataMenu);

document.getElementById("edit-objectName").addEventListener("input", updateObjectData);
document.getElementById("edit-position-x").addEventListener("input", updateObjectData);
document.getElementById("edit-position-y").addEventListener("input", updateObjectData);
document.getElementById("edit-position-z").addEventListener("input", updateObjectData);
document.getElementById("edit-velocity-x").addEventListener("input", updateObjectData);
document.getElementById("edit-velocity-y").addEventListener("input", updateObjectData);
document.getElementById("edit-velocity-z").addEventListener("input", updateObjectData);
document.getElementById("edit-radius").addEventListener("input", updateObjectData);
document.getElementById("edit-mass").addEventListener("input", updateObjectData);
document.getElementById("edit-colour").addEventListener("input", updateObjectData);



document.addEventListener("objectMoved", recordObjectMovement);

async function saveProjectData() {
    const projectName = communicator.getProjNameFromUrl();

    //super jank solution to merge the two surfaces when screenshotting (courtesty of stack overflow)
    const modelSurface = document.getElementById("model-surface");
    const axisViewport = document.getElementById("axisViewport-surface");

    const offScreenCanvas = document.createElement("canvas");
    const width = modelSurface.width;
    const height = modelSurface.height;
    offScreenCanvas.width = width;
    offScreenCanvas.height = height;

    const ctx = offScreenCanvas.getContext("2d");
    ctx.drawImage(modelSurface, 0, 0, width, height);
    ctx.drawImage(axisViewport, 0, 0, width, height);

    const screenshot = offScreenCanvas.toDataURL("image/png");

    await communicator.updateProjectData(projectName, projectData, screenshot);
    clearUnsavedChanges();
}

document.getElementById("openCreateObjectMenu-button").addEventListener("pointerdown", showCreateObjectOverlay);
document.getElementById("hide-createObject-overlay-button").addEventListener("pointerup", hideCreateObjectOverlay);

document.getElementById("deleteObject-button").addEventListener("pointerdown", deleteObject);
document.addEventListener("keydown", workbenchKeyEvents);

document.getElementById("saveProjectButton").addEventListener("pointerdown", saveProjectData);




let currentActiveWorkerId = null;
let currentComputingSimulationName = null;

let progressUpdateInterval;
let currentProgressTimeout;
let lastProgress;
let start_t;

async function updateComputingProgress() {
    const response = await communicator.getComputingProgress(currentActiveWorkerId);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to get simulation computing progress: ${response.message}`;
        return;
    }

    const progress = response.progress;

    if (progress === "COMPUTATION COMPLETE") {
        document.getElementById("computeProgress").classList.add("hidden");
        document.getElementById("stopComputingButton").classList.add("hidden");
        document.getElementById("computeNewSimulationButton").classList.remove("hidden");
        document.getElementById("simulationConfigs").classList.remove("hidden");
        currentActiveWorkerId = null;
        currentComputingSimulationName = null;

        document.getElementById("computeProgressBar-progress").style.width = "0%";

        loadSimulations();   
    } 
    else {
        const progressBar = document.getElementById("computeProgressBar-progress");
        
        const deltaProgress = progress - lastProgress;

        lastProgress = progress;

        const expectedComputeTime = (1 - progress) / deltaProgress * progressUpdateInterval;
        const days = Math.floor(expectedComputeTime / 86400000);
        const hours = Math.floor((expectedComputeTime % 86400000) / 3600000);
        const minutes = Math.floor((expectedComputeTime % 3600000) / 60000);
        const seconds = Math.floor((expectedComputeTime % 60000) / 1000);

        const totalTimeEstimate = (Date.now() - start_t) / progress;

        let waitTimeText = "Approx wait time: ";
        if (days > 0) {
            waitTimeText += `${days}d ${hours}h ${minutes}m `;
        }
        else if (hours > 0) { 
            waitTimeText += `${hours}h ${minutes}m `;
        }
        else if (minutes > 0) {
            waitTimeText += `${minutes}m `;
        }
        waitTimeText += `${seconds}s`;

        document.getElementById("compute-approximateWaitTime").textContent = waitTimeText;


        progressUpdateInterval = totalTimeEstimate / Math.cbrt(totalTimeEstimate);

        progressUpdateInterval = Math.round(progressUpdateInterval);

        const progressBarTiming = {
            duration: progressUpdateInterval,
            iterations: 1,
            fill: "forwards"
        };
        
        progressBar.style.transitionTimingFunction = progressBarTiming;

        const progressPercentage = progress * 100;

        progressBar.style.width = `${progressPercentage}%`;

        document.getElementById("computeProgressText").textContent = `${progressPercentage.toFixed(2)}%`;

        currentProgressTimeout = setTimeout(updateComputingProgress, progressUpdateInterval);
    }
}

async function stopComputingSimulation() {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    const projectName = communicator.getProjNameFromUrl();

    const response = await communicator.stopComputing(
        projectName, currentComputingSimulationName, currentActiveWorkerId
    );

    if (response.status !== "OK") {
        errorMessageDiv.textContent = `Failed to stop Computing: ${response.message}`;
        return;
    }

    currentComputingSimulationName = null;

    clearTimeout(currentProgressTimeout);


    document.getElementById("computeProgress").classList.add("hidden");
    document.getElementById("stopComputeButton").classList.add("hidden");
    document.getElementById("computeNewSimulationButton").classList.remove("hidden");
    document.getElementById("simulationConfigs").classList.remove("hidden");

    if (currentActiveWorkerId) {
        currentActiveWorkerId = null;
        loadSimulations();
    }
}

async function createAndComputeNewSimulation() {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    if (! validateSimulaitonConfigEntrys()) {
        return;
    }

    const projectName = communicator.getProjNameFromUrl();

    projectData.deltaT = parseFloat(document.getElementById("deltaT").value);
    projectData.noOfFrames = parseInt(document.getElementById("noOfFrames").value);

    saveProjectData();

    const newSimulationName = prompt("Enter new simulation name:");

    if (newSimulationName === "") {
        errorMessageDiv.textContent = "No name provided for new simulation.";
        return;
    }
    if (newSimulationName === null) {
        return; //exited prompt
    }

    const response = await communicator.startComputing(projectName, newSimulationName);

    if (response.status !== "OK") {
        errorMessageDiv.textContent = `Failed to start computing simulation: ${response.message}`;
        return;
    }

    currentComputingSimulationName = newSimulationName;
    currentActiveWorkerId = response.workerId;

    document.getElementById("computeProgressBar-progress").style.width = "0%";

    document.getElementById("computeProgress").classList.remove("hidden");
    document.getElementById("stopComputingButton").classList.remove("hidden");
    document.getElementById("computeNewSimulationButton").classList.add("hidden");
    document.getElementById("simulationConfigs").classList.add("hidden");
    
    progressUpdateInterval = 100;
    lastProgress = 0;
    start_t = Date.now();
    currentProgressTimeout = setTimeout(updateComputingProgress, progressUpdateInterval);
}

function validateSimulaitonConfigEntrys() {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    const deltaT_inp = document.getElementById("deltaT");
    const deltaT = parseFloat(deltaT_inp.value);
    if (isNaN(deltaT) || deltaT <= 0) {
        errorMessageDiv.textContent = "Delta time must be a positive non-zero float";
        return false;
    }

    const noOfFrames_inp = document.getElementById("noOfFrames");
    const noOfFrames = parseInt(noOfFrames_inp.value);
    if (isNaN(noOfFrames) || noOfFrames <= 0) {
        errorMessageDiv.textContent = "Number of frames must be a positive non-zero integer";
        return false;
    }

    return true;
}

document.getElementById("deltaT").addEventListener("input", validateSimulaitonConfigEntrys);
document.getElementById("noOfFrames").addEventListener("input", validateSimulaitonConfigEntrys);

document.getElementById("stopComputingButton").addEventListener("pointerdown", stopComputingSimulation);

function handleLeavePage (event) {
    if (unsavedChanges) {
        return "You have unsaved changes. If you leave now, your changes will be lost. Are you sure you want to leave?";
    } 
    else if (currentActiveWorkerId !== null) {
        return "You have a simulating being computed. If you leave now, the current active worker will be orphaned. Are you sure you want to leave?";
    }
}

window.onbeforeunload = handleLeavePage;


async function setupWorkbench() {
    const response = await communicator.loginFromSessionStorage();
    if (response.status === "ERR") {
        //console.error("Automatic login failed");
        location.href = "login.html";
        return;
    }

    loadData();
}

setupWorkbench();