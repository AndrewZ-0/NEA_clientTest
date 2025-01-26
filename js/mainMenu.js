import {communicator} from "./communicator.js";


async function handleLogin() {
    const response = await communicator.getCertificateFromCookies();

    if (response.status !== "OK") {
        console.log(response.message);
        return;
    }

    const certificate = response.certificate;

    if (certificate) {
        console.log("user is already logged in with certificate:", certificate);
        
        //check if certificate is valid
        const response = await communicator.validateCertificate(certificate);
        if (response.status === "OK") {
            //if valid, redirect directly to projects dashboard
            sessionStorage.setItem("certificate", certificate);
            window.location.href = "projectDashboard.html";
        } 
        else {
            console.log("invalid certificate:", response.message);
        }
    } 
    else {
        console.log("no certificate found");
        window.location.href = "login.html";
    }
}


document.getElementById("loginButton").onclick = handleLogin;