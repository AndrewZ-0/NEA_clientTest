import {camera, cameraMode} from "./camera.js";
import {masterRenderer} from "./renderer.js";
import * as linearAlgebra from "../utils/linearAlgebra.js";
import {clock} from "./clock.js";

//fps stuff
const FPS_updateCycle = 30;

let last_update_frame = 0

export function updateFpsOverlay() {
    last_update_frame++;

    if (last_update_frame === FPS_updateCycle) {
        clock.updateFps();
        //this is an absolutely cursed way of doing fstring
        document.getElementById("fps-overlay").innerHTML = `FPS: ${clock.current_fps.toFixed(3)}`; 

        last_update_frame = 0;
    }
}

export function updateShaderOverlays() {
    document.getElementById("shaderMode-overlay").innerHTML = `ShaderMode: ${masterRenderer.shader.name}`;
}

export function updateCameraModeOverlay() {
    document.getElementById("cameraMode-overlay").innerHTML = `CameraMode: ${cameraMode}`;
    if (cameraMode === "Y-Cartesian") {
        document.getElementById("r-overlay").innerHTML = "";
        document.getElementById("altitude-overlay").innerHTML = "";
        document.getElementById("azimuth-overlay").innerHTML = "";
    }
    else {
        document.getElementById("x-overlay").innerHTML = "";
        document.getElementById("y-overlay").innerHTML = "";
        document.getElementById("z-overlay").innerHTML = "";
        document.getElementById("pitch-overlay").innerHTML = "";
        document.getElementById("yaw-overlay").innerHTML = "";
        document.getElementById("roll-overlay").innerHTML = "";
    }
}

export function updateCameraPerspectiveOverlays() {
    document.getElementById("fov-overlay").innerHTML = `FOV: ${camera.fov}`;
    document.getElementById("near-overlay").innerHTML = `Near: ${camera.near}`;
    document.getElementById("far-overlay").innerHTML = `Far: ${camera.far}`;
}

export function updateCameraCartesianCoordsOverlays() {
    document.getElementById("x-overlay").innerHTML = `Camera X: ${camera.coords.x.toFixed(3)}`; 
    document.getElementById("y-overlay").innerHTML = `Camera Y: ${camera.coords.y.toFixed(3)}`; 
    document.getElementById("z-overlay").innerHTML = `Camera Z: ${camera.coords.z.toFixed(3)}`; 
}

export function updateCameraPolarCoordsOverlays() {
    document.getElementById("r-overlay").innerHTML = `R: ${camera.r.toFixed(3)}`; 
    document.getElementById("altitude-overlay").innerHTML = `Altitude: ${linearAlgebra.toDegree(camera.alt).toFixed(3)}`; 
    document.getElementById("azimuth-overlay").innerHTML = `Azimuth: ${linearAlgebra.toDegree(camera.azi).toFixed(3)}`; 
}

export function updateCameraEulerAnglesOverlays() {
    document.getElementById("pitch-overlay").innerHTML = `Pitch: ${
        linearAlgebra.toDegree(linearAlgebra.pitchFromQuat(camera.orientation)).toFixed(3)
    }`; 
    document.getElementById("yaw-overlay").innerHTML = `Yaw: ${
        linearAlgebra.toDegree(linearAlgebra.yawFromQuat(camera.orientation)).toFixed(3)
    }`; 
    document.getElementById("roll-overlay").innerHTML = `Roll: ${
        linearAlgebra.toDegree(linearAlgebra.rollFromQuat(camera.orientation)).toFixed(3)
    }`; 
}


export function updateMousePosOverlays(mouseX, mouseY) {
    document.getElementById("mouseX-overlay").innerHTML = `Mouse X: ${mouseX}`; 
    document.getElementById("mouseY-overlay").innerHTML = `Mouse Y: ${mouseY}`; 
}

export function removeMousePosOverlays() {
    document.getElementById("mouseX-overlay").innerHTML = ""; 
    document.getElementById("mouseY-overlay").innerHTML = ""; 
}

export function updateSelectedOverlay() {
    if (masterRenderer.currentSelection === null) {
        document.getElementById("selection-overlay").innerHTML = "";
    }
    else {
        const selection = masterRenderer.objects[masterRenderer.currentSelection].name;
        document.getElementById("selection-overlay").innerHTML = `Selection: ${selection}`;
    }
}

export function updateSelectionMovementOverlay(axis) {
    if (axis === null) {
        document.getElementById("selectionMovement-overlay").innerHTML = "";
    }
    else {
        document.getElementById("selectionMovement-overlay").innerHTML = `Movement Axis: ${axis}`;
    }
}
