import axios from "axios";

export const storeHttp = axios.create({
  baseURL: "http://localhost:9000/store",
  headers: {
    "Content-Type": "application/json",
    "x-publishable-api-key": import.meta.env.VITE_MEDUSA_API_KEY,
  },
  withCredentials: true,
});

export const authHttp = axios.create({
  baseURL: "http://localhost:9000/auth",
  headers: {
    "Content-Type": "application/json",
    "x-publishable-api-key": import.meta.env.VITE_MEDUSA_API_KEY,
  },
  withCredentials: true,
});

export const baseHttp = axios.create({
  baseURL: "http://localhost:9000",
  headers: {
    "Content-Type": "application/json",
    "x-publishable-api-key": import.meta.env.VITE_MEDUSA_API_KEY,
  },
  withCredentials: true,
});
