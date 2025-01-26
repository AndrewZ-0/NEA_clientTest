import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {updateSelectedOverlay} from "../AGRE/src/core/overlays.js";
import {Cube, Cylinder, Sphere, Torus} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {bindAllControls, unbindAllKeyControls} from "../AGRE/src/core/listeners.js";

function returnToDashboard(event) {
    location.href = "projectDashboard.html";
}

let ge;
let objectsData = {};
let settingsData = {};

document.getElementById("titleBarReturnButton-workbench").addEventListener("pointerdown", returnToDashboard);

async function loadData() {
    const certificate = sessionStorage.getItem("certificate");
    if (!certificate) {
        console.log("No certificate found");
        location.href = "login.html";
        return;
    }

    const projectName = communicator.getProjNameFromUrl();
    console.log("Opening project:", projectName);
    
    document.getElementById("titlebar-project-name").innerHTML = projectName;

    const projectData = await communicator.getProjectData(certificate, projectName);

    if (projectData.status !== "OK") {
        console.error("Failed to load project data:", projectData.message);
        return;
    }

    document.getElementById("projectDataMenu-projectName").innerHTML = projectName;
    document.getElementById("project-creation-date").innerHTML = projectData.data.creationDate;

    objectsData = projectData.data.simConfig;
    settingsData = projectData.data.settings; //will use this later
    let objects = [];
    for (let objectName in objectsData) {
        if (objectsData[objectName]["dtype"] === 0) {
            const obj = objectsData[objectName]["object"];

            let colour = obj["colour"];

            const radius = obj["radius"];
            const fidelity = Math.max(Math.min(radius, 240), 25);

            objects.push(new Sphere(objectName, ...obj["position"], radius, fidelity, colour)); 
        }
    }

    ge = new GraphicsEngine(objects);
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

document.getElementById("createObject-button").addEventListener("pointerdown", createObject);


function openCreateObjectOverlay() {
    document.getElementById("createObject-overlay").classList.remove("hidden");
    document.addEventListener("keydown", createObjectOverlayKeyEvents); 
    
    unbindAllKeyControls();

    document.removeEventListener("keydown", workbenchKeyEvents);
}

function hideCreateObjectOverlay() {
    const errorMessageDiv = document.getElementById("createObject-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

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
    const r = Math.round(colourVec3[0] * 255).toString(16).padStart(2, '0');
    const g = Math.round(colourVec3[1] * 255).toString(16).padStart(2, '0');
    const b = Math.round(colourVec3[2] * 255).toString(16).padStart(2, '0');

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

    const errorMessageDiv = document.getElementById("createObject-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    if (name in objectsData) {
        errorMessageDiv.textContent = "Object name is taken.";
        return;
    }

    const objectType = document.getElementById("objectType").value;

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
        if (isNaN(radius)) {
            errorMessageDiv.textContent = "Radius must be a valid number.";
            return;
        }
        const colour = hexToVec3(document.getElementById("colour").value);

        const fidelity = Math.floor(Math.log(radius + 1) * 30);
        newObject = new Sphere(name, position.x, position.y, position.z, radius, fidelity, colour);

        objectsData[name] = {
            dtype: 0,
            object: {
                position: [position.x, position.y, position.z],
                velocity: [velocity.x, velocity.y, velocity.z],
                radius: radius,
                colour: colour
            }
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

function deleteObject() {
    if (masterRenderer.currentSelection !== null) {
        const name = masterRenderer.objects[masterRenderer.currentSelection].name;
        delete objectsData[name];

        masterRenderer.objects.splice(masterRenderer.currentSelection, 1);
        masterRenderer.currentSelection = null;

        masterRenderer.quickInitialise(masterRenderer.objects);
        ge.quickAnimationStart();

        updateSelectedOverlay();
        markUnsavedChanges();
    }
}

function recordObjectMovement(event) {
    const movedObject = event.detail;

    objectsData[movedObject.name].object.position = [movedObject.x, movedObject.y, movedObject.z];

    populateObjectDataForm(movedObject);

    markUnsavedChanges();
}

function populateObjectDataForm(object) {
    document.getElementById("edit-objectName").value = object.name;
    
    let dtype;
    if (objectsData[object.name].dtype === 0) {
        dtype = "Particle";
    }
    else {
        dtype = "Plane"
    }
    document.getElementById("edit-objectType").value = dtype;

    document.getElementById("edit-position-x").value = object.x;
    document.getElementById("edit-position-y").value = object.y;
    document.getElementById("edit-position-z").value = object.z;
    document.getElementById("edit-velocity-x").value = objectsData[object.name].object.velocity[0];
    document.getElementById("edit-velocity-y").value = objectsData[object.name].object.velocity[1];
    document.getElementById("edit-velocity-z").value = objectsData[object.name].object.velocity[2];
    document.getElementById("edit-radius").value = objectsData[object.name].object.radius;
    document.getElementById("edit-colour").value = vec3ToHex(objectsData[object.name].object.colour);
}

function updateObjectData() {
    const selectedObject = masterRenderer.objects[masterRenderer.currentSelection];

    const name = document.getElementById("edit-objectName").value;
    const position = {
        x: parseFloat(document.getElementById("edit-position-x").value),
        y: parseFloat(document.getElementById("edit-position-y").value),
        z: parseFloat(document.getElementById("edit-position-z").value)
    };
    const velocity = {
        x: parseFloat(document.getElementById("edit-velocity-x").value),
        y: parseFloat(document.getElementById("edit-velocity-y").value),
        z: parseFloat(document.getElementById("edit-velocity-z").value)
    };

    const radius = parseFloat(document.getElementById("edit-radius").value);
    if (isNaN(radius)) {
        populateObjectDataForm(selectedObject); //kinda bad on cpu, but then again im like rendering 3 webgl viewports...
        return;
    }

    const colour = hexToVec3(document.getElementById("edit-colour").value);

    //update view data
    selectedObject.name = name;
    selectedObject.x = position.x;
    selectedObject.y = position.y;
    selectedObject.z = position.z;
    selectedObject.radius = radius;
    selectedObject.colour = colour;

    //update model data
    objectsData[selectedObject.name].object.position = [position.x, position.y, position.z];
    objectsData[selectedObject.name].object.velocity = [velocity.x, velocity.y, velocity.z];
    objectsData[selectedObject.name].object.radius = radius;
    objectsData[selectedObject.name].object.colour = colour;

    masterRenderer.objects[masterRenderer.currentSelection] = selectedObject;

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
document.getElementById("edit-colour").addEventListener("input", updateObjectData);



document.addEventListener("objectMoved", recordObjectMovement);

async function saveProjectData() {
    const certificate = sessionStorage.getItem("certificate");
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

    await communicator.updateProjectData(certificate, projectName, objectsData, screenshot);
    clearUnsavedChanges();
}

document.getElementById("openCreateObjectMenu-button").addEventListener("pointerdown", openCreateObjectOverlay);
document.getElementById("hide-createObject-overlay-button").addEventListener("pointerdown", hideCreateObjectOverlay);

document.getElementById("deleteObject-button").addEventListener("pointerdown", deleteObject);
document.addEventListener("keydown", workbenchKeyEvents);

document.getElementById("saveProjectButton").addEventListener("pointerdown", saveProjectData);

loadData();