import { CustomError } from "@/types/custom-error.type";
import axios, { AxiosError } from "axios";

type ApiErrorResponse =
  | string
  | {
      message?: string;
      errorCode?: string;
    };

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const options = {
  baseURL,
  withCredentials: true,
  timeout: 10000,
};

const API = axios.create(options);

const isPublicAuthPage = (pathname: string) =>
  pathname === "/" ||
  pathname === "/sign-in" ||
  pathname === "/sign-up" ||
  pathname === "/forgot-password" ||
  pathname.startsWith("/reset-password/");

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const data = error.response?.data;
    const status = error.response?.status;
    const message = typeof data === "string" ? data : data?.message;
    const errorCode = typeof data === "string" ? undefined : data?.errorCode;

    if (
      status === 401 &&
      (errorCode === "ACCESS_UNAUTHORIZED" ||
        message === "Unauthorized. Please log in.") &&
      !isPublicAuthPage(window.location.pathname)
    ) {
      const returnUrl = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`
      );
      window.location.href = `/sign-in?returnUrl=${returnUrl}`;
    }

    const customError: CustomError = {
      ...error,
      message:
        message ||
        (error.code === "ERR_NETWORK"
          ? `Unable to reach the API server at ${baseURL}. Make sure the backend is running and VITE_API_BASE_URL is correct for deployment.`
          : error.message) ||
        "Unable to connect to the server. Please check that the backend is running.",
      errorCode: errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  }
);

export default API;
