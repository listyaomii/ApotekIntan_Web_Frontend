import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/penjualan`,
  withCredentials: true,
});

export async function createPenjualan(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating penjualan:", error);
    throw error;
  }
}

export async function getPenjualan(params = {}) {
  try {
    const response = await axiosInstance.get("", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching penjualan:", error);
    throw error;
  }
}

export async function getLaporanPenjualan(params = {}) {
  try {
    const response = await axiosInstance.get("/laporan", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching laporan penjualan:", error);
    throw error;
  }
}

export async function updatePenjualan(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating penjualan:", error);
    throw error;
  }
}

export async function getGrafikPenjualan(params = {}) {
  try {
    const response = await axiosInstance.get("/grafik", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching grafik penjualan:", error);
    throw error;
  }
}

