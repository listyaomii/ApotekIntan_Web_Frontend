import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Menu, Plus, Edit, Trash2 } from "lucide-react";
import * as kategoriService from "../services/kategoriService";
import * as satuanService from "../services/satuanService";

export default function KelolaKategoriSatuan() {
  const [isOpen, setIsOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [satuans, setSatuans] = useState([]);

  const [selectedTab, setSelectedTab] = useState("kategori");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSatuanForm, setShowSatuanForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSatuanId, setEditingSatuanId] = useState(null);

  const [categoryInput, setCategoryInput] = useState("");
  const [satuanInput, setSatuanInput] = useState("");

  const normalizeCategory = (item) => ({
    id: item.id ?? item.id_kategori,
    nama: item.nama_kategori ?? item.nama ?? "",
  });

  const normalizeSatuan = (item) => ({
    id: item.id ?? item.id_satuan,
    nama: item.nama_satuan ?? item.nama ?? "",
  });

  const fetchData = async () => {
    try {
      const [categoryData, satuanData] = await Promise.all([
        kategoriService.getCategories(),
        satuanService.getSatuans(),
      ]);

      setCategories(
        Array.isArray(categoryData)
          ? categoryData.map(normalizeCategory)
          : []
      );

      setSatuans(
        Array.isArray(satuanData)
          ? satuanData.map(normalizeSatuan)
          : []
      );
    } catch (error) {
      console.error("Error loading kategori/satuan:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category handlers
  const handleAddCategory = async () => {
    if (!categoryInput.trim()) {
      alert("Nama kategori tidak boleh kosong.");
      return;
    }

    try {
      if (editingCategoryId) {
        const updated = await kategoriService.updateCategory(editingCategoryId, {
          nama_kategori: categoryInput,
        });

        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategoryId ? normalizeCategory(updated) : c
          )
        );
        alert("Kategori berhasil diperbarui.");
        setEditingCategoryId(null);
      } else {
        const created = await kategoriService.createCategory({
          nama_kategori: categoryInput,
        });

        setCategories((prev) => [...prev, normalizeCategory(created)]);
        alert("Kategori baru berhasil ditambahkan.");
      }
    } catch (error) {
      console.error("Error saving kategori:", error);
      alert("Gagal menyimpan kategori.");
    } finally {
      setCategoryInput("");
      setShowCategoryForm(false);
    }
  };

  const handleEditCategory = (category) => {
    setCategoryInput(category.nama);
    setEditingCategoryId(category.id);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      return;
    }

    try {
      await kategoriService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      alert("Kategori berhasil dihapus.");
    } catch (error) {
      console.error("Error deleting kategori:", error);
      alert("Gagal menghapus kategori.");
    }
  };

  // Satuan handlers
  const handleAddSatuan = async () => {
    if (!satuanInput.trim()) {
      alert("Nama satuan tidak boleh kosong.");
      return;
    }

    try {
      if (editingSatuanId) {
        const updated = await satuanService.updateSatuan(editingSatuanId, {
          nama_satuan: satuanInput,
        });

        setSatuans((prev) =>
          prev.map((s) =>
            s.id === editingSatuanId ? normalizeSatuan(updated) : s
          )
        );
        alert("Satuan berhasil diperbarui.");
        setEditingSatuanId(null);
      } else {
        const created = await satuanService.createSatuan({
          nama_satuan: satuanInput,
        });

        setSatuans((prev) => [...prev, normalizeSatuan(created)]);
        alert("Satuan baru berhasil ditambahkan.");
      }
    } catch (error) {
      console.error("Error saving satuan:", error);
      alert("Gagal menyimpan satuan.");
    } finally {
      setSatuanInput("");
      setShowSatuanForm(false);
    }
  };

  const handleEditSatuan = (satuan) => {
    setSatuanInput(satuan.nama);
    setEditingSatuanId(satuan.id);
    setShowSatuanForm(true);
  };

  const handleDeleteSatuan = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus satuan ini?")) {
      return;
    }

    try {
      await satuanService.deleteSatuan(id);
      setSatuans((prev) => prev.filter((s) => s.id !== id));
      alert("Satuan berhasil dihapus.");
    } catch (error) {
      console.error("Error deleting satuan:", error);
      alert("Gagal menghapus satuan.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#8cce90]/40 via-[#5ec9aa]/30 to-[#29795a]/40 backdrop-blur-xl">
      <Sidebar isOpen={isOpen} active="kelola-kategori-satuan" />

      <div className="flex-1 p-8 text-[#071307]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition"
            >
              <Menu />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Kelola Kategori & Satuan</h1>
            <p className="text-sm text-gray-700 mt-1">Kelola daftar kategori obat dan satuan pengukuran.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kategori Section */}
          <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Daftar Kategori</h2>
              <button
                onClick={() => {
                  setShowCategoryForm(!showCategoryForm);
                  setEditingCategoryId(null);
                  setCategoryInput("");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition text-sm"
              >
                <Plus size={16} /> Tambah
              </button>
            </div>

            {showCategoryForm && (
              <div className="mb-4 p-4 bg-white/10 rounded-3xl border border-white/15">
                <input
                  type="text"
                  placeholder="Nama kategori baru"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/30 border border-white/20 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCategory}
                    className="flex-1 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition text-sm"
                  >
                    {editingCategoryId ? "Perbarui" : "Tambah"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategoryId(null);
                      setCategoryInput("");
                    }}
                    className="flex-1 py-2 rounded-2xl bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="bg-white/90 rounded-3xl p-4 flex items-center justify-between shadow-sm border border-white/20">
                  <span className="font-medium">{category.nama}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 rounded-xl bg-[#5ec9aa]/20 text-[#29795a] hover:bg-[#5ec9aa]/40 transition"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Satuan Section */}
          <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Daftar Satuan</h2>
              <button
                onClick={() => {
                  setShowSatuanForm(!showSatuanForm);
                  setEditingSatuanId(null);
                  setSatuanInput("");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition text-sm"
              >
                <Plus size={16} /> Tambah
              </button>
            </div>

            {showSatuanForm && (
              <div className="mb-4 p-4 bg-white/10 rounded-3xl border border-white/15">
                <input
                  type="text"
                  placeholder="Nama satuan baru"
                  value={satuanInput}
                  onChange={(e) => setSatuanInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/30 border border-white/20 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSatuan}
                    className="flex-1 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition text-sm"
                  >
                    {editingSatuanId ? "Perbarui" : "Tambah"}
                  </button>
                  <button
                    onClick={() => {
                      setShowSatuanForm(false);
                      setEditingSatuanId(null);
                      setSatuanInput("");
                    }}
                    className="flex-1 py-2 rounded-2xl bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {satuans.map((satuan) => (
                <div key={satuan.id} className="bg-white/90 rounded-3xl p-4 flex items-center justify-between shadow-sm border border-white/20">
                  <span className="font-medium">{satuan.nama}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSatuan(satuan)}
                      className="p-2 rounded-xl bg-[#5ec9aa]/20 text-[#29795a] hover:bg-[#5ec9aa]/40 transition"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSatuan(satuan.id)}
                      className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}