class Communicator {
    constructor() {
        this.ip = "https://172.16.8.204:1234";
    }

    async connect() {
        try {
            const response = await fetch(`${this.ip}/connect`);
            if (response.ok) {
                //console.log("Connected to server");
                return true;
            } 
            else {
                console.log("Failed to connect to server");
                return false;
            }
        } 
        catch (error) {
            console.log("Error connecting to server:", error);
            return false;
        }
    }

    async submitData(typeOfFetch, data) {
        const connected = await this.connect();

        if (!connected) {
            return {status: "ERR", message: "Failed to connect to server"};
        }

        const headers = {
            "Content-Type": "application/json",
            ...data
        };

        const response = await fetch(`${this.ip}/${typeOfFetch}`, {
            method: "POST",
            headers: headers,
            credentials: "include",
            body: JSON.stringify(data)
        });

        return await response.json();
    }

    async fetchData(typeOfFetch, data) {
        const connected = await this.connect();

        if (!connected) {
            return {status: "ERR", message: "Failed to connect to server"};
        }

        const headers = {
            "Content-Type": "application/json",
            ...data
        };

        const response = await fetch(`${this.ip}/${typeOfFetch}`, {
            method: "GET",
            headers: headers,
            credentials: "include"
        });

        return await response.json();
    }

    async login(username, password, keepSignedIn) {
        return await this.submitData("login", {username, password, keep_signed_in: keepSignedIn});
    }

    async signup(username, password, email) {
        return await this.submitData("signup", {username, password, email});
    }

    async validateEmail(email) {
        return await this.submitData("validate_email", {email});
    }

    async validateUsername(username) {
        return await this.submitData("validate_username", {username});
    }

    async validatePassword(password) {
        return await this.submitData("validate_password", {password});
    }

    async validateCertificate(certificate) {
        return await this.submitData("validate_certificate", {certificate});
    }

    async create_project(certificate, projectName, filePath) {
        return await this.submitData("create_project", {certificate, projectName, filePath});
    }

    async delete_project(certificate, projectName) {
        return await this.submitData("delete_project", {certificate, projectName});
    }

    async rename_project(certificate, oldProjectName, newProjectName) {
        return await this.submitData("rename_project", {certificate, oldProjectName, newProjectName});
    }

    async logout() {
        return await this.submitData("logout", {});
    }

    async listProjects(certificate) {
        return await this.fetchData("listProjects", {"certificate": certificate});
    }

    async getProjectData(certificate, projectName) {
        return await this.fetchData(
            "get_projectData", 
            {
                "certificate": certificate, 
                "projectName": projectName
            }
        );
    }

    async getSimConfig(certificate, projectName) {
        return await this.fetchData(
            "get_simConfig", 
            {
                "certificate": certificate, 
                "projectName": projectName
            }
        );
    }

    async getSettings(certificate, projectName) {
        return await this.fetchData(
            "get_settings", 
            {
                "certificate": certificate, 
                "projectName": projectName
            }
        );
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }
}

export const communicator = new Communicator();
