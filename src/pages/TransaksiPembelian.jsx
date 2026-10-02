import { useState, useEffect, useRef } from "react";
import PageShell from "../components/PageShell";
import { Trash2 } from "lucide-react";
import * as obatService from "../services/obatService";
import * as kategoriService from "../services/kategoriService";
import * as pembelianService from "../services/pembelianService";
import * as supplierService from "../services/supplierService";
import * as satuanService from "../services/satuanService";

export default function TransaksiPembelian() {
  const [isOpen, setIsOpen] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [satuans, setSatuans] = useState([]);
  const [recentPembelian, setRecentPembelian] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSatuan, setSelectedSatuan] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [tglKadaluarsa, setTglKadaluarsa] = useState("");
  const [suppliers, setSuppliers] = useState([]);

  // State untuk combobox (search) produk
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productBoxRef = useRef(null);

  const formatRupiah = (value) => {
    const numeric = Number(String(value).replace(/[^0-9]/g, ""));
    return Number.isNaN(numeric) ? "0" : numeric.toLocaleString("id-ID");
  };

  const parseRupiah = (value) => String(value).replace(/[^0-9]/g, "");

  const fetchInitialData = async (page = 1) => {
    try {
      setLoadingPurchases(true);

      const [
        productData,
        categoryData,
        pembelianResponse,
        supplierData,
        satuanData,
      ] = await Promise.all([
        obatService.getProducts(),
        kategoriService.getCategories(),
        pembelianService.getPembelian({ page }),
        supplierService.getSuppliers(),
        satuanService.getSatuans(),
      ]);

      setCurrentPage(page);

      // CATEGORIES
      // Diproses lebih dulu (sebelum PRODUCTS) karena dipakai untuk
      // mencocokkan nama_kategori -> id_kategori pada langkah berikutnya.
      let mappedCategories = [];
      if (Array.isArray(categoryData) && categoryData.length > 0) {
        mappedCategories = categoryData.map((category) => ({
          id: category.id ?? category.id_kategori,
          nama: category.nama_kategori ?? category.nama,
          ...category,
        }));
        setCategories(mappedCategories);
      }

      // PRODUCTS
      // PENTING: backend (ObatController + model Obat) menyembunyikan
      // field `id_kategori` dan relasi `kategori` ($hidden), yang dikirim
      // hanya string `nama_kategori`. Karena kita tidak mengubah backend,
      // id_kategori di-resolve di sini dengan mencocokkan nama_kategori
      // terhadap daftar kategori yang sudah di-fetch di atas.
      if (Array.isArray(productData) && productData.length > 0) {
        setProducts(
          productData.map((product) => {
            const matchedCategory = mappedCategories.find(
              (cat) => cat.nama === product.nama_kategori
            );

            return {
              ...product,
              id: product.id ?? product.id_obat,
              nama: product.nama_obat ?? product.nama,
              id_kategori: matchedCategory?.id ?? "",
              nama_kategori: product.nama_kategori ?? matchedCategory?.nama ?? "",
              id_satuan: product.id_satuan,
              harga_jual: product.harga_jual,
              harga_beli: product.harga_beli,
            };
          })
        );
      }

      // SUPPLIERS
      if (Array.isArray(supplierData) && supplierData.length > 0) {
        setSuppliers(
          supplierData.map((supplier) => ({
            id: supplier.id_supplier,
            nama: supplier.nama_supplier,
          }))
        );
      }

      // SATUAN
      if (Array.isArray(satuanData) && satuanData.length > 0) {
        setSatuans(
          satuanData.map((satuan) => ({
            id: satuan.id_satuan,
            nama: satuan.nama_satuan,
          }))
        );
      }

      // PEMBELIAN
      const pembelianData = Array.isArray(pembelianResponse)
        ? pembelianResponse
        : pembelianResponse?.data;

      if (Array.isArray(pembelianData)) {
        setRecentPembelian(
          pembelianData.map((item) => ({
            id: item.id_pembelian ?? item.id,
            tanggal: item.tgl_beli,
            supplier: item.nama_supplier ?? "-",
            total: Number(item.total ?? 0),
            status: "Selesai",
          }))
        );
      }

      setLastPage(
        typeof pembelianResponse === "object" &&
          pembelianResponse?.last_page
          ? pembelianResponse.last_page
          : page
      );
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page === currentPage || page > lastPage) return;
    fetchInitialData(page);
  };

  useEffect(() => {
    fetchInitialData(1);
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      setSelectedCategory("");
      setSelectedSatuan("");
      setSellPrice("");
      return;
    }

    const product = products.find(
      (p) => String(p.id) === String(selectedProduct)
    );

    if (!product) return;

    // Otomatis isi kategori
    if (product.id_kategori) {
      setSelectedCategory(String(product.id_kategori));
    } else {
      setSelectedCategory("");
    }

    // Otomatis isi satuan
    if (product.id_satuan) {
      setSelectedSatuan(String(product.id_satuan));
    } else {
      setSelectedSatuan("");
    }

    // Otomatis isi harga jual
    if (product.harga_jual !== undefined && product.harga_jual !== null) {
      const hargaJualBulat = Math.round(parseFloat(product.harga_jual) || 0);
      setSellPrice(String(hargaJualBulat));
    }
  }, [selectedProduct, products]);

  // Tutup dropdown produk saat klik di luar area combobox
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productBoxRef.current && !productBoxRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Daftar produk yang difilter sesuai teks yang diketik
  const filteredProducts = products.filter((product) =>
    product.nama.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectProduct = (product) => {
    setSelectedProduct(String(product.id));
    setProductSearch(product.nama);
    setShowProductDropdown(false);
  };

  const handleProductSearchChange = (e) => {
    const value = e.target.value;
    setProductSearch(value);
    setShowProductDropdown(true);

    // Jika teks diubah dan tidak lagi cocok persis dengan produk yang sedang dipilih,
    // kosongkan pilihan supaya user tidak submit produk lama secara tidak sengaja.
    const stillMatches = products.find(
      (p) => String(p.id) === String(selectedProduct) && p.nama === value
    );
    if (!stillMatches) {
      setSelectedProduct("");
    }
  };

  const addToCart = () => {
    const hargaBeli = parseInt(price, 10);
    const hargaJual = parseInt(sellPrice, 10);

    if (
      !selectedProduct ||
      !selectedCategory ||
      !selectedSatuan ||
      !tglKadaluarsa ||
      quantity <= 0 ||
      !hargaBeli ||
      hargaBeli <= 0 ||
      !hargaJual ||
      hargaJual <= 0
    ) {
      alert("Lengkapi semua kolom produk sebelum menambahkan.");
      return;
    }

    const product = products.find((p) => String(p.id) === String(selectedProduct));
    const category = categories.find((c) => String(c.id) === String(selectedCategory));
    const satuan = satuans.find((s) => String(s.id) === String(selectedSatuan));

    const newItem = {
      id: selectedProduct,
      nama: product?.nama || "Produk Baru",
      kategori: category?.nama || "-",
      satuan: satuan?.nama || "-",
      id_kategori: selectedCategory,
      id_satuan: selectedSatuan,
      jumlah: quantity,
      harga: hargaBeli,
      harga_jual: hargaJual,
      tgl_kadaluarsa: tglKadaluarsa,
      subtotal: quantity * hargaBeli,
    };

    setCart((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setSelectedCategory("");
    setSelectedSatuan("");
    setQuantity(1);
    setPrice("");
    setSellPrice("");
    setTglKadaluarsa("");
    setProductSearch("");
  };
  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0);

  const itemTotal = () => {
    const hargaBeli = parseInt(price, 10);
    return selectedProduct && selectedCategory && selectedSatuan && quantity > 0 && hargaBeli > 0
      ? quantity * hargaBeli
      : 0;
  };

  const submitTransaction = async () => {
    if (!selectedSupplier || cart.length === 0) {
      alert("Pilih supplier dan tambahkan produk ke keranjang.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        tgl_beli: new Date().toISOString().split("T")[0],
        total: calculateTotal(),
        keterangan: "Transaksi pembelian dari frontend",
        id_supplier: selectedSupplier,
        id_pegawai: 1,

        detail: cart.map((item) => ({
          id_obat: item.id,
          jumlah: item.jumlah,

          harga_satuan: item.harga,
          harga_jual: item.harga_jual,

          id_kategori: item.id_kategori,
          id_satuan: item.id_satuan,

          tgl_kadaluarsa: item.tgl_kadaluarsa,

          subtotal: item.subtotal,
        })),
      };

      console.log("Payload pembelian:", payload);

      await pembelianService.createPembelian(payload);

      alert("Transaksi pembelian berhasil disimpan.");

      setSelectedSupplier("");
      setCart([]);

      await fetchInitialData(1);
    } catch (error) {
      console.error("Error submitting pembelian:", error);

      if (error.response?.data) {
        console.error("Backend response:", error.response.data);
      }

      alert("Gagal menyimpan transaksi pembelian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Transaksi Pembelian"
      subtitle="Kelola pembelian obat dengan ringkas dan cepat."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="transaksi-pembelian"
      rightSlot={null}
    >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Buat Transaksi Baru</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Supplier</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 p-4 bg-white/10 rounded-3xl border border-white/15">
              <h3 className="text-lg font-medium mb-3">Tambah Produk</h3>
              <div className="grid gap-3 md:grid-cols-2 mb-3">
                {/* Combobox produk: ketik untuk mencari, klik hasil untuk memilih */}
                <div className="relative" ref={productBoxRef}>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={handleProductSearchChange}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Ketik nama produk..."
                    className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    autoComplete="off"
                  />
                  {showProductDropdown && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl bg-white shadow-lg border border-white/20">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">Produk tidak ditemukan</div>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className="p-3 text-sm hover:bg-[#8cce90]/20 cursor-pointer transition"
                          >
                            {product.nama}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={
                    categories.find(
                      (category) =>
                        String(category.id) === String(selectedCategory)
                    )?.nama || ""
                  }
                  placeholder="Kategori"
                  readOnly
                  className="p-3 rounded-2xl bg-white/20 border border-white/20"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2 mb-3">
                <input
                  type="text"
                  value={
                    satuans.find(
                      (satuan) =>
                        String(satuan.id) === String(selectedSatuan)
                    )?.nama || ""
                  }
                  placeholder="Satuan"
                  readOnly
                  className="p-3 rounded-2xl bg-white/20 border border-white/20"
                />
                <input
                  type="number"
                  placeholder="Jumlah"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  min="1"
                  className="p-3 rounded-2xl bg-white/30 border border-white/20"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2 mb-3">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Harga Beli per Unit"
                  value={price ? `Rp ${formatRupiah(price)}` : ""}
                  onChange={(e) => setPrice(parseRupiah(e.target.value))}
                  className="p-3 rounded-2xl bg-white/30 border border-white/20"
                />

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Harga Jual"
                  value={sellPrice ? `Rp ${formatRupiah(sellPrice)}` : ""}
                  readOnly
                  className="p-3 rounded-2xl bg-white/20 border border-white/20"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">
                  Tanggal Kadaluarsa
                </label>

                <input
                  type="date"
                  value={tglKadaluarsa}
                  onChange={(e) => setTglKadaluarsa(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white/20 border border-white/20 text-right font-semibold text-lg">
                Total: Rp {formatRupiah(itemTotal())}
              </div>

              <button
                onClick={addToCart}
                className="mt-4 w-full py-3 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition"
              >
                Tambah ke Keranjang
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Keranjang Pembelian</h3>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-600">Keranjang kosong. Tambahkan produk terlebih dahulu.</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="rounded-3xl bg-white/90 p-4 border border-white/20 shadow-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold">{item.nama}</p>
                          <p className="text-sm text-gray-600">{item.kategori} • {item.satuan}</p>
                          <p className="text-sm text-gray-600">{item.jumlah} x Rp {item.harga.toLocaleString("id-ID")}</p>
                          <p className="text-sm text-[#29795a] font-medium"> Harga Jual: Rp {item.harga_jual.toLocaleString("id-ID")} </p>
                          <p className="text-sm text-gray-600"> Kadaluarsa: {item.tgl_kadaluarsa}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="mt-3 text-right font-semibold">Subtotal: Rp {item.subtotal.toLocaleString("id-ID")}</div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="mt-4 rounded-3xl bg-white/10 p-4 border border-white/20 text-right font-semibold text-lg">
                  Total Pembelian: Rp {calculateTotal().toLocaleString("id-ID")}
                </div>
              )}
            </div>

            <button
              onClick={submitTransaction}
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-[#29795a] text-white font-semibold hover:bg-[#245f48] transition disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>

          <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Pembelian Terakhir</h2>
            <div className="space-y-4">
              {recentPembelian.map((item) => (
                <div key={item.id} className="rounded-3xl bg-white/90 p-4 border border-white/20">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold">{item.supplier}</p>
                      <p className="text-sm text-gray-600">{item.tanggal}</p>
                    </div>
                    <span className="rounded-full bg-[#8cce90]/20 px-3 py-1 text-sm text-[#29795a]">{item.status}</span>
                  </div>
                  <div className="text-gray-700">Total Pembelian: Rp {item.total.toLocaleString("id-ID")}</div>
                </div>
              ))}
            </div>
            {lastPage > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loadingPurchases}
                  className="px-4 py-2 rounded-2xl bg-white/70 text-gray-800 font-semibold hover:bg-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <div className="text-sm text-gray-700">
                  Halaman {currentPage} dari {lastPage}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= lastPage || loadingPurchases}
                  className="px-4 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        </div>
    </PageShell>
  );
}