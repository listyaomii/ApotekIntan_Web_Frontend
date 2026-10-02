import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/pegawai`,
  withCredentials: true,
});

export async function getPegawais(params = {}) {
  try {
    const response = await axiosInstance.get("", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching pegawais:", error);
    throw error;
  }
}

export async function getAdminPegawais() {
  try {
    const response = await axiosInstance.get("/admin");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin pegawais:", error);
    throw error;
  }
}

export async function getKurirPegawais() {
  try {
    const response = await axiosInstance.get("/kurir");
    return response.data;
  } catch (error) {
    console.error("Error fetching kurir pegawais:", error);
    throw error;
  }
}

export async function createAdmin(data) {
  try {
    const response = await axiosInstance.post("/admin", data);
    return response.data;
  } catch (error) {
    console.error("Error creating admin pegawai:", error);
    throw error;
  }
}

export async function createKurir(data) {
  try {
    const response = await axiosInstance.post("/kurir", data);
    return response.data;
  } catch (error) {
    console.error("Error creating kurir pegawai:", error);
    throw error;
  }
}

export async function createPegawai(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating pegawai:", error);
    throw error;
  }
}

export async function updatePegawai(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating pegawai ${id}:`, error);
    throw error;
  }
}

export async function deletePegawai(id) {
  try {
    await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting pegawai ${id}:`, error);
    throw error;
  }
}
