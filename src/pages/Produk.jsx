import { Package, Pencil, Trash2, ArrowUp, ArrowDown, Loader } from "lucide-react";
import PageShell from "../components/PageShell";
import { SortDropdown } from "../components/SortDropdown";
import { AddProductForm } from "../components/AddProductForm";
import { Toast } from "../components/Toast";
import { useState, useEffect } from "react";
import * as obatService from "../services/obatService";
import * as kategoriService from "../services/kategoriService";

export default function Produk() {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("expired_asc");
  const [kategoriSort, setKategoriSort] = useState(null);
  const [stokSort, setStokSort] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchData(1);
  }, [search]);

  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const categoriesData = await kategoriService.getCategories();
      const categoryList = Array.isArray(categoriesData) ? categoriesData : [];
      const map = {};
      categoryList.forEach(cat => {
        const categoryId = cat.id ?? cat.id_kategori;
        if (categoryId !== undefined) {
          map[categoryId] = cat.nama_kategori;
        }
      });
      setCategoriesMap(map);

      const productsRes = await obatService.getProducts({
        paginate: "true",
        per_page: 10,
        page,
        q: search
      });
      const productsData = Array.isArray(productsRes) ? productsRes : productsRes?.data ?? [];

      const transformedData = productsData.map((item) => ({
        id: item.id ?? item.id_obat,
        nama_obat: item.nama_obat ?? item.nama,
        id_kategori: item.id_kategori,
        kategori: item.nama_kategori || "N/A",
        harga_jual: item.harga_jual ?? item.harga,
        stok: item.stok,
        tgl_kadaluarsa: item.tgl_kadaluarsa ?? item.expired,
        ...item,
      }));

      setProducts(transformedData);
      setCurrentPage(productsRes?.current_page ?? page);
      setLastPage(productsRes?.last_page ?? 1);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data");
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getCategoryBadgeColor = (categoryName) => {
    if (!categoryName) return "bg-gray-200 text-gray-800";
    const name = categoryName.toLowerCase();
    if (name.includes("antibiotik")) return "bg-green-200 text-green-800";
    if (name.includes("suplemen") || name.includes("vitamin")) return "bg-yellow-200 text-yellow-800";
    if (name.includes("analgesik")) return "bg-orange-200 text-orange-800";
    if (name.includes("antihipertensi")) return "bg-red-200 text-red-800";
    return "bg-blue-200 text-blue-800";
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        await obatService.deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
        showToast("Produk berhasil dihapus!", "success");
      } catch (err) {
        console.error("Error deleting:", err);
        showToast("Gagal menghapus produk", "error");
      }
    }
  };

  const handleEditProduct = (id) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setEditingId(id);
      setShowAddForm(true);
    }
  };

  const handleAddProduct = async (formData) => {
    try {
      if (editingId) {
        await obatService.updateProduct(editingId, formData);

        await fetchData(currentPage);

        showToast("Produk berhasil diperbarui!", "success");
        setEditingId(null);
      } else {
        await obatService.createProduct(formData);

        await fetchData(currentPage);

        showToast("Produk berhasil ditambahkan!", "success");
      }

      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving:", err);
      showToast("Gagal menyimpan produk", "error");
    }
  };

  // Klik header Kategori: toggle asc -> desc -> default, dan nonaktifkan sort Stok
  const handleKategoriSortClick = () => {
    setStokSort(null);
    if (kategoriSort === null) setKategoriSort("asc");
    else if (kategoriSort === "asc") setKategoriSort("desc");
    else setKategoriSort(null);
  };

  // Klik header Stok: toggle asc -> desc -> default, dan nonaktifkan sort Kategori
  const handleStokSortClick = () => {
    setKategoriSort(null);
    if (stokSort === null) setStokSort("asc");
    else if (stokSort === "asc") setStokSort("desc");
    else setStokSort(null);
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (stokSort) {
      const stokA = Number(a.stok) || 0;
      const stokB = Number(b.stok) || 0;
      const comparison = stokA - stokB;

      if (comparison !== 0) {
        return stokSort === "asc" ? comparison : -comparison;
      }
    }

    if (kategoriSort) {
      const comparison = a.kategori.localeCompare(b.kategori);

      if (comparison !== 0) {
        return kategoriSort === "asc" ? comparison : -comparison;
      }
    }

    const dateA = new Date(a.tgl_kadaluarsa || "2099-12-31");
    const dateB = new Date(b.tgl_kadaluarsa || "2099-12-31");

    return sort === "expired_asc"
      ? dateA - dateB
      : dateB - dateA;
  });

  return (
    <>
      <PageShell
        title="Produk"
        subtitle="Kelola daftar produk dan stok secara mudah."
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        active="produk"
        rightSlot={
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-br from-white/40 via-white/20 to-white/10 backdrop-blur-xl px-5 py-3 rounded-xl shadow-md hover:scale-105 transition text-lg font-bold"
          >
            + Tambah Obat
          </button>
        }
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl w-full lg:w-3/5">
            <span className="text-xl">🔍</span>
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none w-full"
            />
          </div>
          <SortDropdown sort={sort} setSort={setSort} />
        </div>

        <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin mr-2" size={24} />
              <span>Memuat produk...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <span>{error}</span>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <span>Tidak ada produk yang ditemukan</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[90px_2fr_1fr_1fr_1fr_120px] px-6 py-4 text-sm font-semibold text-gray-700 border-b border-white/20">
                <span className="text-lg">No</span>
                <span className="text-lg pl-20">Obat</span>
                <button
                  onClick={handleKategoriSortClick}
                  className="text-lg flex items-center gap-1 hover:text-blue-600 transition cursor-pointer"
                >
                  Kategori
                  {kategoriSort === "asc" && <ArrowUp size={16} className="text-blue-600" />}
                  {kategoriSort === "desc" && <ArrowDown size={16} className="text-blue-600" />}
                </button>
                <span className="text-lg">Harga</span>
                <button
                  onClick={handleStokSortClick}
                  className="text-lg flex items-center gap-1 hover:text-blue-600 transition cursor-pointer"
                >
                  Stok
                  {stokSort === "asc" && <ArrowUp size={16} className="text-blue-600" />}
                  {stokSort === "desc" && <ArrowDown size={16} className="text-blue-600" />}
                </button>
                <span className="text-right text-lg flex justify-end gap-2">Aksi</span>
              </div>

              {sortedProducts.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_120px] items-center px-6 py-4 text-sm border-b border-white/10 hover:bg-white/20 transition"
                >
                  <span>{(currentPage - 1) * 10 + index + 1}</span>

                  <div className="flex items-center gap-3 pl-14">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/40">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-semibold">{item.nama_obat}</p>
                      <p className="text-xs text-gray-600">Exp: {formatDate(item.tgl_kadaluarsa)}</p>
                    </div>
                  </div>

                  <span className={`text-xs px-3 py-1 rounded-full font-medium w-fit ${getCategoryBadgeColor(item.kategori)}`}>
                    {item.kategori}
                  </span>

                  <span>Rp {item.harga_jual?.toLocaleString("id-ID") || 0}</span>

                  <span className={`${item.stok <= 5 ? "text-red-500 font-semibold" : ""}`}>
                    {item.stok}
                  </span>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEditProduct(item.id)}
                      className="p-2 rounded-md bg-blue-400 text-white hover:scale-110 transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(item.id)}
                      className="p-2 rounded-md bg-red-400 text-white hover:scale-110 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {lastPage > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 px-2">
            <button
              onClick={() => fetchData(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="px-4 py-2 rounded-2xl bg-white/70 text-gray-800 font-semibold hover:bg-white transition disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {lastPage}
            </span>
            <button
              onClick={() => fetchData(currentPage + 1)}
              disabled={currentPage >= lastPage || loading}
              className="px-4 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        )}
      </PageShell>

      <AddProductForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingId(null);
        }}
        onAddProduct={handleAddProduct}
        showToast={showToast}
        editingId={editingId}
        editingProduct={editingId ? products.find((p) => p.id === editingId) : null}
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
}