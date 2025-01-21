import {masterRenderer} from "./renderer.js";
import * as linearAlgebra from "../utils/linearAlgebra.js";
import * as spaceTransforms from "../utils/spaceTransforms.js";


function objectIntersectsRay(object, rayOrigin, rayDir) {
    const r = object.getBoundingSphereRadius();
    
    const h = linearAlgebra.subVec3(object, rayOrigin); //from camera to sphere origin

    return linearAlgebra.dotVec3(h, rayDir) >= (linearAlgebra.dotVec3(h, h) - r * r) ** 0.5;
}

function minDist(object, rayOrigin) {
    const h = linearAlgebra.subVec3(object, rayOrigin);
    
    return linearAlgebra.magnitudeVec3(h) - object.getBoundingSphereRadius();
}


export function raycastMouseCollisionCheck(mouseX, mouseY) {
    const {x, y} = spaceTransforms.getNormalisedDeviceCoords(masterRenderer.canvas, mouseX, mouseY);
    const rayDir = spaceTransforms.getRayFromNDC(x, y, masterRenderer.matricies.proj, masterRenderer.matricies.view); 
    const rayOrigin = masterRenderer.camera.coords;

    //console.log(rayDir);

    let selectedObject = null;
    let minDistance = Infinity;

    for (let i = 0; i < masterRenderer.objects.length; i++) {
        if (objectIntersectsRay(masterRenderer.objects[i], rayOrigin, rayDir)) {
            const currentMinDistance = minDist(masterRenderer.objects[i], rayOrigin);

            //console.log(currentMinDistance)

            if (currentMinDistance < minDistance) {
                selectedObject = masterRenderer.objects[i];
                minDistance = currentMinDistance;
            }
        }
    }

    let i = null;
    if (selectedObject) {
        const name = selectedObject.name;
        //console.log(`Selected object: ${name}`);

        i = masterRenderer.objects.indexOf(selectedObject);
    } 
    /*
    else {
        console.log('No object selected');
    }
    */
    masterRenderer.handleSelection(i);
}

