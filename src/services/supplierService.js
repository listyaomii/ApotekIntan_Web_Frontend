import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/supplier`,
  withCredentials: true,
});

export async function getSuppliers() {
  try {
    const response = await axiosInstance.get("");
    return response.data;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }
}

export async function createSupplier(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw error;
  }
}

export async function updateSupplier(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating supplier ${id}:`, error);
    throw error;
  }
}

export async function deleteSupplier(id) {
  try {
    await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting supplier ${id}:`, error);
    throw error;
  }
}
