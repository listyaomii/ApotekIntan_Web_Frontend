import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/satuan`,
  withCredentials: true,
});

export async function getSatuans(params = {}) {
  try {
    const response = await axiosInstance.get("", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching satuans:", error);
    throw error;
  }
}

export async function createSatuan(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating satuan:", error);
    throw error;
  }
}

export async function updateSatuan(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating satuan ${id}:`, error);
    throw error;
  }
}

export async function deleteSatuan(id) {
  try {
    await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting satuan ${id}:`, error);
    throw error;
  }
}
