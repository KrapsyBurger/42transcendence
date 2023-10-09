import axios from "axios";
import { toast } from "react-toastify";

export const localhost = process.env.REACT_APP_LOCALHOST;

const api = axios.create({
  baseURL: `http://${localhost}:3333/`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is due to an expired access token (status code 401)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // Show the toast error message
      toast.error("Your session has expired, please login again", {
        className: "toast-message",
      });

      // Clear the access token and user data from local storage
      localStorage.removeItem("access_token");
      localStorage.removeItem("userId");

      // Event to notify the app that the token has expired. Handled in App.tsx
      const event = new CustomEvent('tokenExpired');
      window.dispatchEvent(event);

      // Prevent the original request from being retried
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
