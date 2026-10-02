import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/pesan-antar`,
  withCredentials: true,
});

export async function getPesanAntar(params = {}) {
  try {
    const response = await axiosInstance.get("", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching pesan antar:", error);
    throw error;
  }
}

export async function updatePesanAntar(id, data) {
  try {
    const response = await axiosInstance.patch(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating pesan antar:", error);
    throw error;
  }
}

export async function updateStatusPesanAntar(id, status) {
  try {
    const response = await axiosInstance.patch(`/${id}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating status pesanan:", error);
    throw error;
  }
}

export async function updatePembayaranPesanAntar(id, status_pembayaran) {
  try {
    const response = await axiosInstance.patch(`/${id}/pembayaran`, {
      status_pembayaran,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating pembayaran:", error);
    throw error;
  }
}
