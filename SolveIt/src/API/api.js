import axios from 'axios';

// Use your PC's IP address (e.g., 192.168.x.x) if testing on a physical device
const BASE_URL = 'http://localhost:9090/api';

const API = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, // AI processing can be slow; 60s is safer
    headers: {
        'Accept': 'application/json',
    },
});

export const solveMath = async (formData) => {
    try {
        const response = await API.post('/solve', formData, {
            headers: {
                // REQUIRED for Axios + React Native FormData
                'Content-Type': 'multipart/form-data',
            },
            // Critical for large file uploads to show progress or avoid early termination
            transformRequest: (data) => data, 
        });

        // Axios automatically parses JSON responses
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error("Backend Error Details:", error.response.data);
            throw new Error(error.response.data.message || "Server processed request but failed.");
        } else if (error.request) {
            console.error("Network Error: No response received. Is ADB reverse running?");
            throw new Error("Cannot connect to server.");
        } else {
            console.error("Setup Error:", error.message);
            throw error;
        }
    }
};

export default API;