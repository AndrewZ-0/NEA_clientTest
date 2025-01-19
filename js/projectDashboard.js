import {communicator} from "./communicator.js";

async function logout(event) {
    const confirmation = confirm("Are you sure you want to log out?");
    if (confirmation) {
        await communicator.logout();

        sessionStorage.removeItem("certificate");
        location.href = "mainMenu.html";
    }
}

document.getElementById("titleBarButton").addEventListener("pointerdown", logout);

function showNewProjectOverlay(event) {
    console.log("Opening new project overlay");
    document.getElementById("new-project-overlay").classList.remove("hidden");
}

function hideNewProjectOverlay(event) {
    document.getElementById("new-project-overlay").classList.add("hidden");
}

document.getElementById("hide-new-project-overlay-button").addEventListener("pointerdown", hideNewProjectOverlay);

async function createNewProject(event) {
    event.preventDefault();  //stop default js form features

    const projectName = document.getElementById("project-name").value.trim();
    const certificate = sessionStorage.getItem("certificate");
    const filePath = `./projects/${projectName}`;
    const errorMessageDiv = document.getElementById("new-project-error-message");

    errorMessageDiv.textContent = ""; //clear prev msgs

    if (!projectName) {
        errorMessageDiv.textContent = "Project name is required.";
        return;
    }

    const response = await communicator.create_project(certificate, projectName, filePath);

    if (response.status !== "OK") {
        console.log("Failed to create project:", response.message);
        errorMessageDiv.textContent = response.message;
        return;
    }

    //alert("New Project Created!"); //kinda don't need this
    hideNewProjectOverlay();
    loadProjects(); //reload all project cards to include the new ones
    //note to self: by this point, open the project
}

document.getElementById("create-new-project-button").addEventListener("pointerdown", createNewProject);

async function deleteProject(event) {
    const confirmation = confirm("Are you sure you want to delete this project?");
    if (confirmation) {
        const projectName = focusedCard.querySelector(".project-name").textContent;
        const certificate = sessionStorage.getItem("certificate");

        const response = await communicator.delete_project(certificate, projectName);

        if (response.status !== "OK") {
            console.log("Failed to delete project:", response.message);
            alert(`Failed to delete project: ${response.message}`);
            return;
        }

        //alert("Project deleted!");
        loadProjects();
        document.getElementById("renameProject").disabled = true;
        document.getElementById("deleteProject").disabled = true;
    }
}

document.getElementById("deleteProject").addEventListener("pointerdown", deleteProject);

function showRenameProjectOverlay(event) {
    console.log("Opening rename project overlay");
    document.getElementById("rename-project-overlay").classList.remove("hidden");
}

function hideRenameProjectOverlay(event) {
    document.getElementById("rename-project-overlay").classList.add("hidden");
}

document.getElementById("hide-rename-project-overlay-button").addEventListener("pointerdown", hideRenameProjectOverlay);

async function renameProject(event) {
    event.preventDefault();  //stop default js form features

    const newProjectName = document.getElementById("new-project-name").value.trim();
    const certificate = sessionStorage.getItem("certificate");
    const oldProjectName = focusedCard.querySelector(".project-name").textContent;
    const errorMessageDiv = document.getElementById("rename-project-error-message");

    errorMessageDiv.textContent = ""; //clear prev msgs

    if (!newProjectName) {
        errorMessageDiv.textContent = "New project name is required.";
        return;
    }

    const response = await communicator.rename_project(certificate, oldProjectName, newProjectName);

    if (response.status !== "OK") {
        console.log("Failed to rename project:", response.message);
        errorMessageDiv.textContent = response.message;
        return;
    }

    alert("Project Renamed!");
    hideRenameProjectOverlay();
    loadProjects(); //reload all project cards to include the renamed ones
}

document.getElementById("rename-project-button").addEventListener("pointerdown", renameProject);

document.getElementById("renameProject").addEventListener("pointerdown", showRenameProjectOverlay);

function handleKeyPresses(event) {
    let options = Array.prototype.slice.call(document.querySelectorAll(".project-card, .new-project-card"));
    let index = options.indexOf(focusedCard);

    if (event.key === "ArrowRight" && index < options.length - 1) {
        if (options[index]) {
            options[index].classList.remove("focus");
        }
        focusedCard = options[++index];
        focusedCard.classList.add("focus");
        focusedCard.focus();
    } 
    else if (event.key === "ArrowLeft" && index > 0) {
        if (options[index]) {
            options[index].classList.remove("focus");
        }
        focusedCard = options[--index];
        focusedCard.classList.add("focus");
        focusedCard.focus();
    } 
    else if (event.key === "Escape") {
        if (focusedCard) {
            focusedCard.classList.remove("focus");
            document.getElementById("renameProject").disabled = true;
            document.getElementById("deleteProject").disabled = true;
        }
        focusedCard = null;
    } 
    else if (event.key === "Enter" && focusedCard) {
        if (focusedCard.classList.contains("project-card")) {
            console.log("Open project");
        } 
        else if (focusedCard.classList.contains("new-project-card")) {
            showNewProjectOverlay();
        }
    }
}

let focusedCard = null;

document.addEventListener("keydown", handleKeyPresses);


//combined for new project and project cards since both share the same selection system
function handleSelectProjectCard(event) {
    var target = event.target.closest(".project-card, .new-project-card");
    if (target) {
        const cards = document.querySelectorAll(".project-card, .new-project-card");
        for (let i = 0; i < cards.length; i++) {
            cards[i].classList.remove("focus");
        }

        if (target.classList.contains("project-card") && target === focusedCard) {
            console.log("Open project");
        } 
        else if (target.classList.contains("new-project-card") && target === focusedCard) {
            showNewProjectOverlay();
        }

        target.classList.add("focus");
        focusedCard = target;

        document.getElementById("renameProject").disabled = false;
        document.getElementById("deleteProject").disabled = false;
    }
}


async function loadProjects() {
    const certificate = sessionStorage.getItem("certificate");
    if (!certificate) {
        console.log("No certificate found");
        location.href = "login.html";
        return;
    }

    const response = await communicator.listProjects(certificate);
    if (response.status !== "OK") {
        console.log("Failed to load projects:", response.message);

        alert(response.message);
        return;
    }

    const projectNames = response.data;

    const projectCardsContainer = document.getElementById("projectCardsContainer");
    const newProjectCard = document.querySelector(".new-project-card"); //save for to put at the end
    
    projectCardsContainer.innerHTML = ""; //clear to reload all cards

    let projects = {};

    for (let i = 0; i < projectNames.length; i++) {
        const projectResponse = await communicator.fetchData("get_projectData", {certificate, projectName: projectNames[i]}); 
        
        if (projectResponse.status !== "OK") {
            console.log("Failed to load project data:", projectResponse.message);
            return;
        }
        
        projects[projectNames[i]] = projectResponse.data;
    }

    //sort projects by last accessed
    //const sortedProjects = Object.values(projects).sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));

    for (const projectName in projects) {
        const project = projects[projectName];

       //console.log(project);

        const projectCard = document.createElement("div");
        projectCard.className = "project-card";
        projectCard.tabIndex = 0;
        projectCard.addEventListener("pointerdown", handleSelectProjectCard)

        const img = document.createElement("img");
        img.src = "./assets/project1.png";
        img.alt = "Project Icon";

        const projectDetails = document.createElement("div");
        projectDetails.className = "project-details";

        const projectNameLabel = document.createElement("label");
        projectNameLabel.className = "project-name";
        projectNameLabel.textContent = projectName;

        const lastOpenedLabel = document.createElement("label");
        lastOpenedLabel.textContent = `Last opened ${project.lastAccessed}`;

        projectDetails.appendChild(projectNameLabel);
        projectDetails.appendChild(lastOpenedLabel);

        projectCard.appendChild(img);
        projectCard.appendChild(projectDetails);

        projectCardsContainer.appendChild(projectCard);
    }

    //super dumb way of keeping new project card at the end
    projectCardsContainer.appendChild(newProjectCard);
}

document.addEventListener("DOMContentLoaded", () => {
    const newProjectCards = document.querySelectorAll(".new-project-card");
    
    for (const newProjectCard of newProjectCards) {
        newProjectCard.addEventListener("pointerdown", handleSelectProjectCard)
    }

    loadProjects();

    //if focus is on when reloading, ensure buttons are kept disabled
    document.getElementById("renameProject").disabled = true;
    document.getElementById("deleteProject").disabled = true;
});
