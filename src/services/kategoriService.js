import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/kategori`,
  withCredentials: true,
});

/**
 * Get all categories
 */
export async function getCategories() {
  try {
    const response = await axiosInstance.get("");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

/**
 * Get a single category by ID
 * @param {number} id - Category ID
 */
export async function getCategoryById(id) {
  try {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new category
 * @param {Object} data - Category data
 */
export async function createCategory(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

/**
 * Update a category
 * @param {number} id - Category ID
 * @param {Object} data - Updated category data
 */
export async function updateCategory(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a category
 * @param {number} id - Category ID
 */
export async function deleteCategory(id) {
  try {
    await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
}
