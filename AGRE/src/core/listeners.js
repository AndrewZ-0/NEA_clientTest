import {camera, toggleCameraMode} from "./camera.js";
import {masterRenderer, orientationRenderer, axisRenderer} from "./renderer.js";
import {raycastMouseCollisionCheck} from "./raycast.js"
import {
    updateMousePosOverlays, removeMousePosOverlays, 
    updateSelectedOverlay, updateSelectionMovementOverlay
} from "./overlays.js";


export let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false, 
    left: false, 
    right: false, 
    up: false, 
    down: false, 
    comma: false, 
    period: false
};

function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            keys.w = true;
            break;
        case "a":
            keys.a = true;
            break;
        case "s":
            keys.s = true;
            break;
        case "d":
            keys.d = true;
            break;
        case "shift":
            keys.shift = true;
            break;
        case " ":
            keys.space = true;
            break;
        case "arrowleft":
            keys.left = true;
            break;
        case "arrowright":
            keys.right = true;
            break;
        case "arrowup":
            keys.up = true;
            break;
        case "arrowdown":
            keys.down = true;
            break;
        case ",":
            keys.comma = true;
            break;
        case ".":
            keys.period = true;
            break;
        default:
            break;
    }
}

function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            keys.w = false;
            break;
        case "a":
            keys.a = false;
            break;
        case "s":
            keys.s = false;
            break;
        case "d":
            keys.d = false;
            break;
        case "shift":
            keys.shift = false;
            break;
        case " ":
            keys.space = false;
            break;
        case "arrowleft":
            keys.left = false;
            break;
        case "arrowright":
            keys.right = false;
            break;
        case "arrowup":
            keys.up = false;
            break;
        case "arrowdown":
            keys.down = false;
            break;
        case ",":
            keys.comma = false;
            break;
        case ".":
            keys.period = false;
            break;
        case "x":
            toggleSelectionMovement("x");
            break;
        case "y":
            toggleSelectionMovement("y");
            break;
        case "z":
            toggleSelectionMovement("z");
            break;
        case "p":
            masterRenderer.toggleShaderMode();
            break;
        case "c":
            toggleCameraMode();
            masterRenderer.camera = camera; //reset camera pointer for master renderer
            axisRenderer.camera = camera;
            orientationRenderer.camera = camera;
            camera.forceUpdateCamera(masterRenderer.matricies.view);
            camera.forceUpdateCamera(axisRenderer.matricies.view);
            //camera.forceUpdateCamera(orientationRenderer.matricies.view);
            break;
        default:
            break;
    }
}


let lastX;
let lastY;
export let mouseDragging = false;
let clickFlag = true;

function nextMouseOffset(event) {
    const xoffset = lastX - event.clientX;
    const yoffset = lastY - event.clientY;
    lastX = event.clientX;
    lastY = event.clientY;

    return {x: xoffset, y: yoffset};
}

function quickUpdateMouseEvents() {
    if (selectionMovementAxis !== null) {
        masterRenderer.moveSelectedObjectAlong(selectionMovementAxis, lastX, lastY);
    }
}

function handleMouseMove(event) {
    if (selectionMovementAxis !== null) {
        //const offset = nextMouseOffset(event);
        masterRenderer.moveSelectedObjectAlong(selectionMovementAxis, event.clientX, event.clientY);
    }
    else if (mouseDragging) {
        clickFlag = false; //no longer a click

        //get relative change on screen
        const offset = nextMouseOffset(event);

        camera.onMouseMove(offset);
    }

    updateMousePosOverlays(event.x, event.y);
}

function handleMouseButtonDown(event) {
    if (event.button === 0) {
        mouseDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
    }
}

function handleMouseButtonUp(event) {
    if (event.button === 0) {
        if (clickFlag) {
            raycastMouseCollisionCheck(event.x, event.y);
            toggleSelectionMovement(null);
            updateSelectedOverlay();
        }
        else {
            clickFlag = true;
        }

        mouseDragging = false;
    }
}

function handleMouseButtonLeave(event) {
    mouseDragging = false;
    clickFlag = true;

    removeMousePosOverlays();
}


function bindCameraCallbacks(canvas) {
    canvas.addEventListener("pointermove", handleMouseMove);
    canvas.addEventListener("pointerdown", handleMouseButtonDown);
    canvas.addEventListener("pointerup", handleMouseButtonUp);
    canvas.addEventListener("pointerleave", handleMouseButtonLeave);
}

export function bindAllControls(canvas) {
    document.addEventListener(
        "keydown", function(event) {
            handleKeyDown(event);
        }
    );
    document.addEventListener(
        "keyup", function(event) {
            handleKeyUp(event);
        }
    );

    bindCameraCallbacks(canvas);
}

export function bindVisabilityChange(lambda) {
    document.addEventListener("visibilitychange", lambda)
}


export let selectionMovementAxis = null;
function toggleSelectionMovement(axis) {
    if (masterRenderer.currentSelection !== null) {
        if (selectionMovementAxis === axis) {
            selectionMovementAxis = null;
        }
        else {
            selectionMovementAxis = axis;
        }
        updateSelectionMovementOverlay(selectionMovementAxis);
        axisRenderer.updateFlag = true;
    }
    else if (axis === null) {
        selectionMovementAxis = null;
        updateSelectionMovementOverlay(selectionMovementAxis);
        axisRenderer.updateFlag = true;
    }
}
