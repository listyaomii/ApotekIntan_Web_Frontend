import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/pembelian`,
  withCredentials: true,
});

export async function getPembelian(params = {}) {
  try {
    const response = await axiosInstance.get("", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching pembelian:", error);
    throw error;
  }
}

export async function createPembelian(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating pembelian:", error);
    throw error;
  }
}

export async function getPembelianById(id) {
  try {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching pembelian ${id}:`, error);
    throw error;
  }
}

export async function updatePembelian(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating pembelian ${id}:`, error);
    throw error;
  }
}

export async function deletePembelian(id) {
  try {
    await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting pembelian ${id}:`, error);
    throw error;
  }
}

export const getPembelians = async (page = 1) => {
  const response = await api.get(`/pembelian?page=${page}`);
  return response.data;
};

export async function getLaporanPembelian(params = {}) {
  try {
    const response = await axiosInstance.get("/laporan", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching laporan pembelian:", error);
    throw error;
  }
}