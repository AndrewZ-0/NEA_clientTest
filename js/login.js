import {communicator} from "./communicator.js";

function togglePasswordVisibility() {
    const passwordField = document.getElementById("password");

    if (document.getElementById("show-password").checked) {
        passwordField.type = "text";
    } 
    else {
        passwordField.type = "password";
    }
}

async function validateForm(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const keepSignedIn = document.getElementById("keep-signed-in").checked;
    const errorMessageDiv = document.getElementById("error-message");

    errorMessageDiv.textContent = ""; //clear prev msgs

    let errors = [];

    if (!username.trim()) {
        errors.push("Username is required.");
    }
    if (!password.trim()) {
        errors.push("Password is required.");
    }

    if (errors.length > 0) {
        errorMessageDiv.textContent = errors.join(" ");
    } 
    else {
        const response = await communicator.login(username, password, keepSignedIn);
        if (response.status === "OK") {
            sessionStorage.setItem("certificate", response.certificate);

            window.location.href = "projectDashboard.html";
        }
        else {
            console.log("Login failed:", response.message);
            errorMessageDiv.textContent = response.message;
        }
    }
}

document.getElementById("show-password").onclick = togglePasswordVisibility;
document.querySelector("form").onsubmit = validateForm;