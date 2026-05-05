import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(^| )${name}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[2]) : null;
};

axiosInstance.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrf_token");
  if (csrfToken) {
    config.headers["x-csrf-token"] = csrfToken;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const resolveQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/signin") &&
      !originalRequest.url.includes("/auth/signup") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => axiosInstance(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post("/auth/refresh");
        resolveQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        resolveQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
