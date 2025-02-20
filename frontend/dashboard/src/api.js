import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api", // Replace with your backend URL
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor to Add Access Token to Headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Request Interceptor Error:", error);
        return Promise.reject(error);
    }
);

// Response Interceptor to Handle Token Expiration
api.interceptors.response.use(
    (response) => response, // Return response if successful
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is due to an expired token
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log("Access token expired. Attempting to refresh...");
            originalRequest._retry = true; // Prevent infinite loops

            try {
                // Attempt to refresh the token
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) {
                    console.error("No refresh token available.");
                    throw new Error("No refresh token available.");
                }

                const { data } = await axios.post("http://localhost:5000/api/refresh", { refreshToken });

                // Debugging Response
                console.log("New access token received:", data.accessToken);

                // Save new access token
                localStorage.setItem("accessToken", data.accessToken);

                // Update the failed request with the new token
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);

                // Logout the user if refresh fails
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error); // Pass other errors to the caller
    }
);

export default api;
