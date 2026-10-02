import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CategoryDropdown } from "./CategoryDropdown";
import * as satuanService from "../services/satuanService";

export function AddProductForm({
  isOpen,
  onClose,
  onAddProduct,
  showToast,
  editingId,
  editingProduct,
}) {
  const [satuans, setSatuans] = useState([]);

  const [formData, setFormData] = useState({
    nama_obat: "",
    id_kategori: "",
    id_satuan: "",
    harga_jual: "",
    stok_minimum: "",
    deskripsi: "",
  });

  // Ambil data satuan
  useEffect(() => {
    const fetchSatuans = async () => {
      try {
        const data = await satuanService.getSatuans();
        setSatuans(Array.isArray(data) ? data : data?.data ?? []);
      } catch (error) {
        console.error("Gagal mengambil data satuan:", error);
        showToast("Gagal memuat data satuan", "error");
      }
    };

    if (isOpen) {
      fetchSatuans();
    }
  }, [isOpen]);

  // Load data ketika edit
  useEffect(() => {
    if (editingId && editingProduct) {
      setFormData({
        nama_obat: editingProduct.nama_obat || "",
        id_kategori: editingProduct.id_kategori || "",
        id_satuan: editingProduct.id_satuan || "",
        harga_jual: editingProduct.harga_jual || "",
        stok_minimum: editingProduct.stok_minimum || "",
        deskripsi: editingProduct.deskripsi || "",
      });
    } else {
      setFormData({
        nama_obat: "",
        id_kategori: "",
        id_satuan: "",
        harga_jual: "",
        stok_minimum: "",
        deskripsi: "",
      });
    }
  }, [isOpen, editingId, editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (id_kategori) => {
    setFormData((prev) => ({
      ...prev,
      id_kategori,
    }));
  };

  const handleSatuanChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      id_satuan: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.nama_obat ||
      !formData.id_kategori ||
      !formData.id_satuan ||
      !formData.harga_jual ||
      !formData.stok_minimum
    ) {
      showToast("Field yang wajib diisi belum lengkap!", "error");
      return;
    }

    const data = {
      nama_obat: formData.nama_obat,
      id_kategori: parseInt(formData.id_kategori),
      id_satuan: parseInt(formData.id_satuan),
      harga_jual: parseInt(formData.harga_jual),
      stok_minimum: parseInt(formData.stok_minimum),
      deskripsi: formData.deskripsi || null,
    };

    onAddProduct(data);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl z-50">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">
            {editingId ? "Edit Obat" : "Tambah Obat Baru"}
          </h2>

          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-lg transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Nama Obat */}
          <div>
            <label className="block text-base font-semibold text-black/85 mb-2">
              Nama Obat
            </label>

            <input
              type="text"
              name="nama_obat"
              value={formData.nama_obat}
              onChange={handleChange}
              placeholder="Contoh: Paracetamol 500 mg"
              className="w-full px-4 py-2.5 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:bg-white/80 focus:border-blue-400 transition text-gray-800 placeholder-gray-500"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-base font-semibold text-black/85 mb-2">
              Kategori
            </label>

            <CategoryDropdown
              value={formData.id_kategori}
              onChange={handleCategoryChange}
            />
          </div>

          {/* Satuan */}
          <div>
            <label className="block text-base font-semibold text-black/85 mb-2">
              Satuan
            </label>

            <select
              name="id_satuan"
              value={formData.id_satuan}
              onChange={handleSatuanChange}
              className="w-full px-4 py-2.5 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:bg-white/80 focus:border-blue-400 transition text-gray-800"
            >
              <option value="">Pilih satuan</option>

              {satuans.map((satuan) => (
                <option
                  key={satuan.id_satuan}
                  value={satuan.id_satuan}
                >
                  {satuan.nama_satuan}
                </option>
              ))}
            </select>
          </div>

          {/* Harga Jual */}
          <div>
            <label className="block text-base font-semibold text-black/85 mb-2">
              Harga Jual
            </label>

            <input
              type="number"
              name="harga_jual"
              value={formData.harga_jual}
              onChange={handleChange}
              placeholder="Contoh: 10000"
              min="0"
              className="w-full px-4 py-2.5 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:bg-white/80 focus:border-blue-400 transition text-gray-800 placeholder-gray-500"
            />
          </div>

          {/* Stok Minimum */}
          <div>
            <label className="block text-base font-semibold text-black/85 mb-2">
              Stok Minimum
            </label>

            <input
              type="number"
              name="stok_minimum"
              value={formData.stok_minimum}
              onChange={handleChange}
              placeholder="Contoh: 10"
              min="0"
              className="w-full px-4 py-2.5 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:bg-white/80 focus:border-blue-400 transition text-gray-800 placeholder-gray-500"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-base font-semibold text-black/85 mb-2">
              Deskripsi
            </label>

            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              placeholder="Informasi tambahan mengenai obat (opsional)"
              rows={3}
              className="w-full px-4 py-2.5 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:bg-white/80 focus:border-blue-400 transition text-gray-800 placeholder-gray-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-200/50 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
            >
              Batal
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
            >
              {editingId ? "Simpan Perubahan" : "Tambah Obat"}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}