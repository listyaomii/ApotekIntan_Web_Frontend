import { useState, useEffect, useRef } from "react";
import PageShell from "../components/PageShell";
import { Menu, Trash2 } from "lucide-react";
import * as penjualanService from "../services/penjualanService";
import * as pasienService from "../services/pasienService";
import * as obatService from "../services/obatService";

// Bandingkan hanya tanggal (tanpa jam), supaya obat yang kadaluarsa
// PERSIS hari ini masih dianggap belum kadaluarsa (baru diblok besok).
const isProductExpired = (product) => {
  if (!product?.tgl_kadaluarsa) return false;
  const expiryDate = new Date(product.tgl_kadaluarsa);
  if (Number.isNaN(expiryDate.getTime())) return false;
  const todayDateOnly = new Date(new Date().toDateString());
  const expiryDateOnly = new Date(expiryDate.toDateString());
  return expiryDateOnly < todayDateOnly;
};

const isProductOutOfStock = (product) => Number(product?.stok ?? 0) <= 0;

export default function TransaksiPenjualan() {
  const [isOpen, setIsOpen] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);  
  const [lastPage, setLastPage] = useState(1); 

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");

  // State combobox Pasien
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerBoxRef = useRef(null);

  // State combobox Produk
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productBoxRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [pasienRes, obatRes, penjualanRes] = await Promise.all([
          pasienService.getPasiens(),
          obatService.getProducts(),
          penjualanService.getPenjualan({ page: 1 }),  
        ]);
        setCustomers(Array.isArray(pasienRes) ? pasienRes : pasienRes.data || []);
        setProducts(Array.isArray(obatRes) ? obatRes : obatRes.data || []);

    
        const penjualanData = Array.isArray(penjualanRes) ? penjualanRes : penjualanRes.data || [];
        setRecentSales(
          penjualanData.map((item) => ({
            ...item,
            total: Number(item.total ?? 0),
          }))
        );
        setLastPage(penjualanRes.last_page ?? 1);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    if (!selectedProduct) return;
    const product = products.find(
      (p) => String(p.id_obat || p.id) === String(selectedProduct)
    );
    if (product) {
      const harga = Math.round(parseFloat(product.harga_jual) || 0);
      setPrice(String(harga));  // ← set sebagai integer string, misal "3500"
    }
  }, [selectedProduct, products]);
  const today = new Date().toISOString().slice(0, 10);
  const [tglJual, setTglJual] = useState(today);

  const formatRupiah = (value) => {
    const numeric = Number(String(value).replace(/[^0-9]/g, ""));
    return Number.isNaN(numeric) ? "0" : numeric.toLocaleString("id-ID");
  };

  const parseRupiah = (value) => String(value).replace(/[^0-9]/g, "");

  // Tutup dropdown saat klik di luar area combobox (pasien & produk)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerBoxRef.current && !customerBoxRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
      if (productBoxRef.current && !productBoxRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- Combobox Pasien ----
  const filteredCustomers = customers.filter((customer) => {
    const text = `${customer.nama} ${customer.no_telp}`.toLowerCase();
    return text.includes(customerSearch.toLowerCase());
  });

  const matchesGeneral = "pasien umum".includes(customerSearch.toLowerCase());

  const handleSelectCustomer = (id, label) => {
    setSelectedCustomer(String(id));
    setCustomerSearch(label);
    setShowCustomerDropdown(false);
  };

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearch(value);
    setShowCustomerDropdown(true);

    if (value === "") {
      setSelectedCustomer("");
      return;
    }

    // Kalau teks tidak lagi cocok dengan pilihan sebelumnya, reset pilihan
    const stillMatchesGeneral = selectedCustomer === "general" && value === "Pasien Umum (tidak terdaftar)";
    const stillMatchesCustomer = customers.find(
      (c) => String(c.id_pasien) === String(selectedCustomer) && `${c.nama} - ${c.no_telp}` === value
    );
    if (!stillMatchesGeneral && !stillMatchesCustomer) {
      setSelectedCustomer("");
    }
  };

  // ---- Combobox Produk ----
  const filteredProducts = products.filter((product) =>
    product.nama_obat.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectProduct = (product) => {
    const unavailable = isProductOutOfStock(product) || isProductExpired(product);
    if (unavailable) return;

    setSelectedProduct(String(product.id_obat));
    setProductSearch(product.nama_obat);
    setShowProductDropdown(false);
  };

  const handleProductSearchChange = (e) => {
    const value = e.target.value;
    setProductSearch(value);
    setShowProductDropdown(true);

    if (value === "") {
      setSelectedProduct("");
      return;
    }

    const stillMatches = products.find(
      (p) => String(p.id_obat) === String(selectedProduct) && p.nama_obat === value
    );
    if (!stillMatches) {
      setSelectedProduct("");
    }
  };

  const addToCart = () => {
    const hargaInput = parseInt(price, 10);  // ← ganti nama jadi hargaInput
    if (!selectedProduct || quantity <= 0 || !hargaInput || hargaInput <= 0) {
      alert("Lengkapi semua kolom produk sebelum menambahkan.");
      return;
    }

    const product = products.find((p) => String(p.id_obat) === String(selectedProduct));
    if (!product) return;

    // Pengaman eksplisit: stok habis tidak boleh dijual,
    // walau secara kebetulan sudah tertahan juga oleh cek quantity > stok di bawah.
    if (isProductOutOfStock(product)) {
      alert(`Stok ${product.nama_obat} habis, tidak bisa dijual.`);
      return;
    }

    // Pengaman eksplisit: obat kadaluarsa tidak boleh dijual.
    if (isProductExpired(product)) {
      alert(`${product.nama_obat} sudah kadaluarsa dan tidak bisa dijual.`);
      return;
    }

    if (quantity > product.stok) {
      alert(`Stok ${product.nama_obat} tidak cukup. Stok tersedia: ${product.stok}`);
      return;
    }

    const hargaJual = parseFloat(product.harga_jual) || 0;  // ← satu-satunya hargaJual

    const newItem = {
      id: product.id_obat,
      nama: product.nama_obat,
      kategori: product.nama_kategori,
      satuan: product.nama_satuan,
      jumlah: quantity,
      harga: hargaJual,
      subtotal: quantity * hargaJual,
    };

    setCart((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setQuantity(1);
    setPrice("");
    setProductSearch("");
  };

  const handlePageChange = async (page) => {
  if (page < 1 || page > lastPage) return;
  const res = await penjualanService.getPenjualan({ page });
  const data = Array.isArray(res) ? res : res.data || [];
  setRecentSales(
    data.map((item) => ({
      ...item,
      total: Number(item.total ?? 0),
    }))
  );
  setCurrentPage(page);
  setLastPage(res.last_page ?? lastPage);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0);

  const itemTotal = () => {
    if (!selectedProduct || quantity <= 0) return 0;
    const product = products.find((p) => String(p.id_obat) === String(selectedProduct));
    if (!product) return 0;
    const hargaJual = parseFloat(product.harga_jual) || 0;
    return quantity * hargaJual;
  };

  const submitTransaction = () => {
    if (!selectedCustomer || cart.length === 0) {
      alert("Pilih pasien (atau pilih 'Pasien Umum') dan tambahkan produk ke keranjang.");
      return;
    }

    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) {
      alert("Data pegawai tidak ditemukan. Silakan login kembali.");
      return;
    }

    const payload = {
      tgl_jual: tglJual,
      total: calculateTotal(),
      id_pegawai: userId,
      id_pasien: selectedCustomer === "general" ? null : selectedCustomer,
      detail: cart.map((item) => ({
        id_obat: item.id,
        jumlah: item.jumlah,
        harga_satuan: item.harga,
        subtotal: item.subtotal,
      })),
    };

    setLoading(true);
    penjualanService
      .createPenjualan(payload)
      .then(() => {
        alert("Transaksi penjualan berhasil disimpan.");
        setSelectedCustomer("");
        setCustomerSearch("");
        setCart([]);
        // Refresh data penjualan terbaru
        penjualanService.getPenjualan({ limit: 5 }).then((res) => {
          setRecentSales(res.data || []);
        });
      })
      .catch((err) => {
        console.error("Error creating penjualan:", err);
        const msg = err?.response?.data?.message || "Gagal menyimpan transaksi.";
        alert(msg);
      })
      .finally(() => setLoading(false));
  };

  return (
    <PageShell
      title="Transaksi Penjualan"
      subtitle="Kelola penjualan obat kepada pasien dengan cepat dan mudah."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="transaksi-penjualan"
      rightSlot={null}
    >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Buat Transaksi Penjualan</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Pasien</label>
              {/* Combobox pasien: ketik untuk mencari, klik hasil untuk memilih */}
              <div className="relative" ref={customerBoxRef}>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={handleCustomerSearchChange}
                  onFocus={() => setShowCustomerDropdown(true)}
                  disabled={loadingData}
                  placeholder={loadingData ? "Memuat data..." : "Ketik nama pasien..."}
                  className="w-full p-3 rounded-2xl bg-white/30 border border-white/20 disabled:opacity-50"
                  autoComplete="off"
                />
                {showCustomerDropdown && !loadingData && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl bg-white shadow-lg border border-white/20">
                    {matchesGeneral && (
                      <div
                        onClick={() => handleSelectCustomer("general", "Pasien Umum (tidak terdaftar)")}
                        className="p-3 text-sm hover:bg-[#8cce90]/20 cursor-pointer transition font-medium"
                      >
                        Pasien Umum (tidak terdaftar)
                      </div>
                    )}
                    {filteredCustomers.length === 0 && !matchesGeneral ? (
                      <div className="p-3 text-sm text-gray-500">Pasien tidak ditemukan</div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id_pasien}
                          onClick={() =>
                            handleSelectCustomer(customer.id_pasien, `${customer.nama} - ${customer.no_telp}`)
                          }
                          className="p-3 text-sm hover:bg-[#8cce90]/20 cursor-pointer transition"
                        >
                          {customer.nama} - {customer.no_telp}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tanggal Jual</label>
              <input
                type="date"
                value={tglJual}
                onChange={(e) => setTglJual(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
              />
            </div>

            <div className="mb-4 p-4 bg-white/10 rounded-3xl border border-white/15">
              <h3 className="text-lg font-medium mb-3">Tambah Produk</h3>
              <div className="mb-3">
                {/* Combobox produk: ketik untuk mencari, klik hasil untuk memilih */}
                <div className="relative" ref={productBoxRef}>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={handleProductSearchChange}
                    onFocus={() => setShowProductDropdown(true)}
                    disabled={loadingData}
                    placeholder={loadingData ? "Memuat data..." : "Ketik nama produk..."}
                    className="w-full p-3 rounded-2xl bg-white/30 border border-white/20 disabled:opacity-50"
                    autoComplete="off"
                  />
                  {showProductDropdown && !loadingData && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl bg-white shadow-lg border border-white/20">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">Produk tidak ditemukan</div>
                      ) : (
                        filteredProducts.map((product) => {
                          const outOfStock = isProductOutOfStock(product);
                          const expired = isProductExpired(product);
                          const unavailable = outOfStock || expired;

                          let statusLabel = "";
                          if (expired) statusLabel = " - Kadaluarsa";
                          else if (outOfStock) statusLabel = " - Stok Habis";

                          return (
                            <div
                              key={product.id_obat}
                              onClick={() => handleSelectProduct(product)}
                              className={`p-3 text-sm transition ${
                                unavailable
                                  ? "text-gray-400 cursor-not-allowed bg-gray-100/50"
                                  : "hover:bg-[#8cce90]/20 cursor-pointer"
                              }`}
                            >
                              {product.nama_obat} (Stok: {product.stok}){statusLabel}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 mb-3">
                <input
                  type="number"
                  placeholder="Jumlah"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  min="1"
                  className="p-3 rounded-2xl bg-white/30 border border-white/20"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Harga Jual per Unit"
                  value={price ? `Rp ${formatRupiah(price)}` : ""}
                  onChange={(e) => setPrice(parseRupiah(e.target.value))}
                  className="p-3 rounded-2xl bg-white/30 border border-white/20"
                />
              </div>
              <div className="p-3 rounded-2xl bg-white/20 border border-white/20 text-right font-semibold text-lg mb-4">
                Total: Rp {formatRupiah(itemTotal())}
              </div>

              <button
                onClick={addToCart}
                className="w-full py-3 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition"
              >
                Tambah ke Keranjang
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Keranjang Penjualan</h3>
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
                  Total Penjualan: Rp {calculateTotal().toLocaleString("id-ID")}
                </div>
              )}
            </div>

            <button
              onClick={submitTransaction}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#29795a] text-white font-semibold hover:bg-[#245f48] transition disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>

          <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Penjualan Terakhir</h2>
            <div className="space-y-4">
              {loadingData ? (
                <p className="text-sm text-gray-600">Memuat data penjualan...</p>
              ) : recentSales.length === 0 ? (
                <p className="text-sm text-gray-600">Belum ada data penjualan.</p>
              ) : (
                recentSales.map((item) => (
                  <div key={item.id} className="rounded-3xl bg-white/90 p-4 border border-white/20">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold">{item.nama_pasien || "Pasien Umum"}</p>
                        <p className="text-sm text-gray-600">{new Date(item.tgl_jual).toLocaleDateString("id-ID")}</p>
                      </div>
                      <span className="rounded-full bg-[#8cce90]/20 px-3 py-1 text-sm text-[#29795a]">Selesai</span>
                    </div>
                    <div className="text-gray-700">Total Penjualan: Rp {item.total.toLocaleString("id-ID")}</div>
                  </div>
                ))
              )}
            </div>
              {lastPage > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 rounded-2xl bg-white/70 text-gray-800 font-semibold hover:bg-white transition disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-700">
                  Halaman {currentPage} dari {lastPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= lastPage}
                  className="px-4 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition disabled:opacity-50"
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