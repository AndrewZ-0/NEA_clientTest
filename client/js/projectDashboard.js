import {communicator} from "./communicator.js";

async function logout(event) {
    const confirmation = confirm("Are you sure you want to log out?");
    if (confirmation) {
        await communicator.logout();

        sessionStorage.removeItem("certificate");
        location.href = "mainMenu.html";
    }
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", logout);

function createNewProjectScreenKeyEvents(event) {
    if (event.key === "Escape") {
        hideNewProjectOverlay();
    } 
    else if (event.key === "Enter") {
        createNewProject();
    }
}

function renameProjectScreenKeyEvents(event) {
    if (event.key === "Escape") {
        hideRenameProjectOverlay();
    } 
    else if (event.key === "Enter") {
        renameProject();
    }
}

function showNewProjectOverlay(event) {
    document.getElementById("new-project-overlay").classList.remove("hidden");
    document.removeEventListener("keydown", dashboardKeyEvents);
    document.addEventListener("keydown", createNewProjectScreenKeyEvents);
}

function hideNewProjectOverlay(event) {
    document.getElementById("new-project-overlay").classList.add("hidden");
    document.removeEventListener("keydown", createNewProjectScreenKeyEvents);
    document.addEventListener("keydown", dashboardKeyEvents);
}

document.getElementById("hide-new-project-overlay-button").addEventListener("pointerdown", hideNewProjectOverlay);

async function createNewProject(event) {
    event?.preventDefault();  //stop default js form features

    const projectName = document.getElementById("project-name").value.trim();
    const filePath = `./projects/${projectName}`;
    const errorMessageDiv = document.getElementById("new-project-error-message");

    errorMessageDiv.textContent = ""; //clear prev msgs

    if (!projectName) {
        errorMessageDiv.textContent = "Project name is required.";
        return;
    }

    const response = await communicator.create_project(projectName, filePath);

    if (response.status !== "OK") {
        console.error("Failed to create project:", response.message);
        errorMessageDiv.textContent = response.message;
        return;
    }

    hideNewProjectOverlay();
    //loadProjectCards(); //reload all project cards to include the new ones
    openProjectWorkbench(projectName);
}

document.getElementById("create-new-project-button").addEventListener("pointerdown", createNewProject);

async function deleteProject(event) {
    const confirmation = confirm("Are you sure you want to delete this project?");
    if (confirmation) {
        const projectName = focusedCard.querySelector(".project-name").textContent;

        const response = await communicator.delete_project(projectName);

        if (response.status !== "OK") {
            console.error("Failed to delete project:", response.message);
            //alert(`Failed to delete project: ${response.message}`);
            return;
        }

        loadProjectCards();
        document.getElementById("renameProject").disabled = true;
        document.getElementById("deleteProject").disabled = true;

        document.getElementById("deleteProject").removeEventListener("pointerdown", deleteProject);
        document.getElementById("renameProject").removeEventListener("pointerdown", showRenameProjectOverlay);
    }
}

function showRenameProjectOverlay(event) {
    document.getElementById("rename-project-overlay").classList.remove("hidden");
    document.removeEventListener("keydown", dashboardKeyEvents);
    document.addEventListener("keydown", renameProjectScreenKeyEvents);
}

function hideRenameProjectOverlay(event) {
    document.getElementById("rename-project-overlay").classList.add("hidden");
    document.getElementById("rename-project-error-message").replaceChildren(); //clear in case the overlay is closed, then opened again
    document.removeEventListener("keydown", renameProjectScreenKeyEvents);
    document.addEventListener("keydown", dashboardKeyEvents);
}

document.getElementById("hide-rename-project-overlay-button").addEventListener("pointerdown", hideRenameProjectOverlay);

async function renameProject(event) {
    event?.preventDefault();  //stop default js form features

    const newProjectName = document.getElementById("new-project-name").value.trim();
    const oldProjectName = focusedCard.querySelector(".project-name").textContent;
    const errorMessageDiv = document.getElementById("rename-project-error-message");

    errorMessageDiv.textContent = ""; //clear prev msgs

    if (!newProjectName) {
        errorMessageDiv.textContent = "New project name is required.";
        return;
    }

    const response = await communicator.rename_project(oldProjectName, newProjectName);

    if (response.status !== "OK") {
        console.error("Failed to rename project:", response.message);
        errorMessageDiv.textContent = response.message;
        return;
    }

    hideRenameProjectOverlay();
    loadProjectCards(); //reload all project cards to include the renamed ones
}

document.getElementById("rename-project-button").addEventListener("pointerdown", renameProject);


function dashboardKeyEvents(event) {
    const newProjectOverlayVisible = !document.getElementById("new-project-overlay").classList.contains("hidden");
    const renameProjectOverlayVisible = !document.getElementById("rename-project-overlay").classList.contains("hidden");

    if (newProjectOverlayVisible || renameProjectOverlayVisible) {
        return; 
    }

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

            document.getElementById("deleteProject").removeEventListener("pointerdown", deleteProject);
            document.getElementById("renameProject").removeEventListener("pointerdown", showRenameProjectOverlay);
        }
        focusedCard = null;
    } 
    else if (event.key === "Enter" && focusedCard) {
        if (focusedCard.classList.contains("project-card")) {
            const projectName = focusedCard.querySelector(".project-name").textContent;
            openProjectWorkbench(projectName);
        } 
        else if (focusedCard.classList.contains("new-project-card")) {
            showNewProjectOverlay();
        }
    }
}

let focusedCard = null;

document.addEventListener("keydown", dashboardKeyEvents);


//combined for new project and project cards since both share the same selection system
function handleSelectProjectCard(event) {
    var target = event.target.closest(".project-card, .new-project-card");
    if (target) {
        const cards = document.querySelectorAll(".project-card, .new-project-card");
        for (let i = 0; i < cards.length; i++) {
            cards[i].classList.remove("focus");
        }

        if (target.classList.contains("project-card") && target === focusedCard) {
            const projectName = target.querySelector(".project-name").textContent;
            openProjectWorkbench(projectName);
        } 
        else if (target.classList.contains("new-project-card") && target === focusedCard) {
            showNewProjectOverlay();
        }

        target.classList.add("focus");
        focusedCard = target;

        if (target.classList.contains("project-card")) {
            document.getElementById("renameProject").disabled = false;
            document.getElementById("deleteProject").disabled = false;

            document.getElementById("deleteProject").addEventListener("pointerdown", deleteProject);
            document.getElementById("renameProject").addEventListener("pointerdown", showRenameProjectOverlay);
        } 
        else {
            document.getElementById("renameProject").disabled = true;
            document.getElementById("deleteProject").disabled = true;

            document.getElementById("deleteProject").removeEventListener("pointerdown", deleteProject);
            document.getElementById("renameProject").removeEventListener("pointerdown", showRenameProjectOverlay);
        }
    }
}

async function openProjectWorkbench(projectName) {
    await communicator.updateAccessProjectTime(projectName);
    window.location.href = `projectWorkbench.html?project=${projectName}`;
}

//obllitory merge sort reference
function mergeSortProjCardsByLastAccessed(projs, keys) {
    if (keys.length <= 1) {
        return keys;
    }

    const middle = Math.floor(keys.length / 2); 
    const left = mergeSortProjCardsByLastAccessed(projs, keys.slice(0, middle));
    const right = mergeSortProjCardsByLastAccessed(projs, keys.slice(middle));

    let l_pointer = 0;
    let r_pointer = 0;
    let lr_merged = [];

    while (l_pointer < left.length && r_pointer < right.length) {
        //ugliest line I have written in quite a while...
        if (new Date(projs[left[l_pointer]].lastAccessed) >= new Date(projs[right[r_pointer]].lastAccessed)) {
            lr_merged.push(left[l_pointer]);
            l_pointer++;
        }
        else {
            lr_merged.push(right[r_pointer]);
            r_pointer++;
        }
    }

    while (l_pointer < left.length) {
        lr_merged.push(left[l_pointer]);
        l_pointer++;
    }

    while (r_pointer < right.length) {
        lr_merged.push(right[r_pointer]);
        r_pointer++;
    }

    return lr_merged;
}


async function loadProjectCards() {
    const response = await communicator.listProjects();
    if (response.status !== "OK") {
        console.error("Failed to load projects:", response.message);
        //alert(response.message);
        return;
    }

    const projectNames = response.data;

    const projectCardsContainer = document.getElementById("projectCardsContainer");
    const newProjectCard = document.querySelector(".new-project-card"); //save for to put at the end
    
    projectCardsContainer.replaceChildren(); //clear to reload all cards

    let projects = {};

    for (let i = 0; i < projectNames.length; i++) {
        const projectResponse = await communicator.getProjectData(projectNames[i]); 
        
        if (projectResponse.status !== "OK") {
            console.error("Failed to load project data:", projectResponse.message);
            return;
        }
        
        projects[projectNames[i]] = projectResponse.data;
    }

    //sort by most recently accessed first
    const sortedProjectNames = mergeSortProjCardsByLastAccessed(projects, Object.keys(projects));

    for (const projectName of sortedProjectNames) {
        const project = projects[projectName];

        const projectCard = document.createElement("div");
        projectCard.className = "project-card";
        projectCard.tabIndex = 0;
        projectCard.addEventListener("pointerdown", handleSelectProjectCard);

        const imgResponse = await communicator.getProjectScreenshot(projectName);

        if (imgResponse.status !== "OK") {
            console.error("Failed to load project screenshot:", imgResponse.message);
            return;
        }

        const img = document.createElement("img");
        img.src = imgResponse.image;
        img.alt = "Project Screenshot";

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

async function setupDashboard() {
    const response = await communicator.loginFromSessionStorage();
    if (response.status === "ERR") {
        //console.error("Automatic login failed");
        location.href = "login.html";
        return;
    }

    const newProjectCards = document.querySelectorAll(".new-project-card");
    
    for (const newProjectCard of newProjectCards) {
        newProjectCard.addEventListener("pointerdown", handleSelectProjectCard)
    }

    loadProjectCards();
}

setupDashboard();


//if focus is on when reloading, ensure buttons are kept disabled
document.getElementById("renameProject").disabled = true;
document.getElementById("deleteProject").disabled = true;

