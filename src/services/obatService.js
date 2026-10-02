import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/obat`,
  withCredentials: true,
});

/**
 * Get all products with optional filters and search
 * @param {Object} params - Query parameters
 * @param {string} params.q - Search by product name
 * @param {number} params.id_kategori - Filter by category
 * @param {number} params.id_satuan - Filter by unit
 * @param {string} params.stok_status - Filter by stock status (out|low)
 * @param {string} params.expired - Filter by expiration (true|false|near)
 * @param {number} params.days - Days range for near expiration
 * @param {string} params.sort_by - Sort by field (nama_obat|harga_jual|harga_beli|stok)
 * @param {string} params.sort_dir - Sort direction (asc|desc)
 * @param {boolean} params.paginate - Enable pagination
 * @param {number} params.per_page - Items per page
 */
export async function getProducts(params = {}) {
  try {
    const response = await axiosInstance.get("", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 */
export async function getProductById(id) {
  try {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new product
 * @param {Object} data - Product data
 */
export async function createProduct(data) {
  try {
    const response = await axiosInstance.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

/**
 * Update an existing product
 * @param {number} id - Product ID
 * @param {Object} data - Updated product data
 */
export async function updateProduct(id, data) {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a product
 * @param {number} id - Product ID
 */
export async function deleteProduct(id) {
  try {
    await axiosInstance.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

/**
 * Get out of stock products
 */
export async function getOutOfStock() {
  try {
    const response = await axiosInstance.get("/out-of-stock");
    return response.data;
  } catch (error) {
    console.error("Error fetching out of stock products:", error);
    throw error;
  }
}

/**
 * Get nearly expired products
 * @param {number} days - Days range (default: 30)
 */
export async function getNearlyExpired(days = 30) {
  try {
    const response = await axiosInstance.get("/nearly-expired", {
      params: { days },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching nearly expired products:", error);
    throw error;
  }
}

/**
 * Get expired products
 */
export async function getExpired() {
  try {
    const response = await axiosInstance.get("/expired");
    return response.data;
  } catch (error) {
    console.error("Error fetching expired products:", error);
    throw error;
  }
}

export async function getLaporanStok(params = {}) {
  try {
    const response = await axiosInstance.get("/laporan-stok", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching laporan stok:", error);
    throw error;
  }
}
