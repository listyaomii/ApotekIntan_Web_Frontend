import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/pasien`,
  withCredentials: true,
});

export async function getPasiens(params = {}) {
  try {
    const response = await axiosInstance.get("", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching pasiens:", error);
    throw error;
  }
}

export async function createPasien(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating pasien:", error);
    throw error;
  }
}

export async function updatePasien(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating pasien ${id}:`, error);
    throw error;
  }
}

export async function deletePasien(id) {
  try {
    await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting pasien ${id}:`, error);
    throw error;
  }
}
