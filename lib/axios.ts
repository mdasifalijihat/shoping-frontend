import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ message?: unknown }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        error.message = message;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
