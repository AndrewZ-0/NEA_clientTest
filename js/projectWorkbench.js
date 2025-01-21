import {GraphicsEngine} from "../AGRE/src/app.js";
import {Cube, Cylinder, Sphere, Torus} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";

function returnToDashboard(event) {
    location.href = "projectDashboard.html";
}

document.getElementById("titleBarButton").addEventListener("pointerdown", returnToDashboard);

async function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get("projectName");
    const certificate = sessionStorage.getItem("certificate");
    console.log("Opening project:", projectName);
    
    document.getElementById("titlebar-project-name").innerHTML = projectName;

    const projectData = await communicator.getProjectData(certificate, projectName);

    if (projectData.status !== "OK") {
        console.error("Failed to load project data:", projectData.message);
        return;
    }

    const objectsData = projectData.data.simConfig;
    const settingsData = projectData.data.settings; //will use this later
    let objects = [];
    for (let i in objectsData) {
        if (objectsData[i]["dtype"] === 0) {
            let obj = objectsData[i]["object"];

            let colour = obj["colour"];

            const radius = obj["radius"];
            const fidelity = Math.max(Math.min(radius, 240), 25);

            objects.push(new Sphere(i, ...obj["position"], radius, fidelity, colour)); 
        }
    }

    const ge = new GraphicsEngine(objects);
    ge.start();
}

loadData();
