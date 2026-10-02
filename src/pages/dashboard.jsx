import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Package, ShoppingCart, DollarSign, AlertCircle, Truck, Users, AlertTriangle, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const formatRupiah = (value) => {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
};

const StatCard = ({ icon: Icon, label, value, color, bgColor, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white/30 p-5 rounded-2xl flex items-center justify-between gap-4 ${onClick ? "cursor-pointer hover:bg-white/40 transition" : ""}`}
  >
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
    <div className={`w-12 h-12 flex items-center justify-center rounded-full ${bgColor}`}>
      <Icon size={22} className={color} />
    </div>
  </div>
);

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  // Stats
  const [totalProduk, setTotalProduk]       = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [pendapatan, setPendapatan]         = useState(0);
  const [stokHabis, setStokHabis]           = useState(0);
  const [totalSupplier, setTotalSupplier]   = useState(0);
  const [totalKurir, setTotalKurir]         = useState(0);
  const [pesananMenunggu, setPesananMenunggu] = useState(0);
  const [kadaluarsa, setKadaluarsa]         = useState(0);

  // Lists
  const [grafik, setGrafik]       = useState([]);
  const [terlaris, setTerlaris]   = useState([]);
  const [pesananBaru, setPesananBaru] = useState([]);
  const [stokKritis, setStokKritis]  = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [
          produkRes, transaksiRes, pendapatanRes, stokRes,
          grafikRes, terlarisRes, supplierRes, kurirRes,
          pesananRes, kadaluarsaRes, stokKritisRes,
        ] = await Promise.all([
          axios.get(`${API_URL}/obat/count`),
          axios.get(`${API_URL}/penjualan/count-bulan-ini`),
          axios.get(`${API_URL}/penjualan/pendapatan-bulan-ini`),
          axios.get(`${API_URL}/obat/stok-habis`),
          axios.get(`${API_URL}/penjualan/grafik-mingguan`),
          axios.get(`${API_URL}/detail-penjualan/terlaris`),
          axios.get(`${API_URL}/supplier`),
          axios.get(`${API_URL}/pegawai/kurir`),
          axios.get(`${API_URL}/pesan-antar`),
          axios.get(`${API_URL}/obat/expired`),
          axios.get(`${API_URL}/obat/laporan-stok`),
        ]);

        setTotalProduk(produkRes.data?.total ?? 0);
        setTotalTransaksi(transaksiRes.data?.total ?? 0);
        setPendapatan(Number(pendapatanRes.data?.total ?? 0));
        setStokHabis(stokRes.data?.total ?? 0);

        // Supplier & Kurir
        const suppliers = Array.isArray(supplierRes.data) ? supplierRes.data : supplierRes.data?.data ?? [];
        const kurirs    = Array.isArray(kurirRes.data) ? kurirRes.data : [];
        setTotalSupplier(suppliers.length);
        setTotalKurir(kurirs.length);

        // Pesanan menunggu
        const semuaPesanan = Array.isArray(pesananRes.data) ? pesananRes.data : pesananRes.data?.data ?? [];
        const menunggu = semuaPesanan.filter((p) => p.status === "menunggu");
        setPesananMenunggu(menunggu.length);
        setPesananBaru(menunggu.slice(0, 5));

        // Kadaluarsa
        const expiredList = Array.isArray(kadaluarsaRes.data) ? kadaluarsaRes.data : kadaluarsaRes.data?.data ?? [];
        setKadaluarsa(expiredList.length);

        // Stok kritis
        const stokList = Array.isArray(stokKritisRes.data) ? stokKritisRes.data : stokKritisRes.data?.data ?? [];
        const kritis = stokList.filter((o) => Number(o.stok) <= Number(o.stok_minimum));
        setStokKritis(kritis.slice(0, 5));

        // Grafik
        const hariMap = { 0: "Min", 1: "Sen", 2: "Sel", 3: "Rab", 4: "Kam", 5: "Jum", 6: "Sab" };
        setGrafik(
          (grafikRes.data ?? []).map((item) => ({
            name: hariMap[new Date(item.tanggal).getDay()] ?? item.tanggal,
            penjualan: Number(item.total ?? 0),
          }))
        );

        // Terlaris
        setTerlaris(
          (terlarisRes.data ?? []).slice(0, 5).map((item) => ({
            nama: item.obat?.nama_obat ?? item.nama_obat ?? "-",
            terjual: item.total_terjual ?? 0,
          }))
        );
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <PageShell
      title="Dashboard"
      subtitle="Ringkasan aktivitas apotek hari ini."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="dashboard"
      rightSlot={null}
    >
      {/* Alert pesanan menunggu */}
      {pesananMenunggu > 0 && (
        <div
          onClick={() => navigate("/kelola-kurir")}
          className="cursor-pointer bg-yellow-100/70 border border-yellow-400 rounded-3xl p-4 mb-6 flex items-center justify-between gap-4 hover:bg-yellow-100 transition"
        >
          <p className="text-yellow-800 text-sm font-medium">
            🛵 Ada <strong>{pesananMenunggu} pesanan antar</strong> yang menunggu dikonfirmasi dan ditugaskan kurir.
          </p>
          <span className="text-yellow-700 text-xs font-semibold whitespace-nowrap">Lihat →</span>
        </div>
      )}

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard icon={Package}      label="Produk Obat"              value={loading ? "..." : totalProduk}            bgColor="bg-[#8cce90]"  color="text-[#071307]" onClick={() => navigate("/Produk")} />
        <StatCard icon={ShoppingCart} label="Transaksi Bulan Ini"       value={loading ? "..." : totalTransaksi}         bgColor="bg-[#5ec9aa]"  color="text-[#071307]" onClick={() => navigate("/transaksi-penjualan")} />
        <StatCard icon={DollarSign}   label="Pendapatan Bulan Ini"      value={loading ? "..." : formatRupiah(pendapatan)} bgColor="bg-[#29795a]" color="text-white"     />
        <StatCard icon={ShoppingBag}  label="Pesanan Menunggu"          value={loading ? "..." : pesananMenunggu}       bgColor="bg-yellow-400" color="text-white"     onClick={() => navigate("/kelola-kurir")} />
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={AlertTriangle}label="Stok Minimum"     value={loading ? "..." : stokHabis}     bgColor="bg-orange-400"    color="text-white" onClick={() => navigate("/stok-kadaluarsa")} />
        <StatCard icon={AlertCircle}  label="Obat Kadaluarsa"  value={loading ? "..." : kadaluarsa}   bgColor="bg-red-400" color="text-white" onClick={() => navigate("/stok-kadaluarsa")} />
        <StatCard icon={Users}        label="Supplier"         value={loading ? "..." : totalSupplier} bgColor="bg-blue-400"   color="text-white" onClick={() => navigate("/kelola-supplier")} />
        <StatCard icon={Truck}        label="Kurir"            value={loading ? "..." : totalKurir}    bgColor="bg-purple-400" color="text-white" onClick={() => navigate("/kelola-kurir")} />
      </div>

      {/* Row: Grafik + Terlaris */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Grafik Penjualan */}
        <div className="xl:col-span-2 bg-white/30 backdrop-blur-xl p-5 rounded-2xl shadow-lg">
          <h3 className="font-semibold text-sm mb-3">📈 Penjualan Minggu Ini</h3>
          <div style={{ width: "100%", height: 200 }}>
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Memuat grafik...</div>
            ) : grafik.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Belum ada data minggu ini.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={grafik}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 10 }} width={60} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Penjualan"]} />
                  <Line type="monotone" dataKey="penjualan" stroke="#29795a" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Produk Terlaris */}
        <div className="bg-white/30 p-5 rounded-2xl shadow-lg">
          <h3 className="font-semibold text-sm mb-3">🏆 Produk Terlaris</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : terlaris.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {terlaris.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white ${
                      i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-400" : "bg-white/40 text-gray-600"
                    }`}>{i + 1}</span>
                    <span className="text-gray-700 truncate max-w-[140px]">{item.nama}</span>
                  </div>
                  <span className="font-semibold text-[#29795a]">{item.terjual} item</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row: Pesanan Menunggu + Stok Kritis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pesanan Antar Menunggu */}
        <div className="bg-white/30 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">🛵 Pesanan Menunggu Kurir</h3>
            <button
              onClick={() => navigate("/kelola-kurir")}
              className="text-xs text-[#29795a] font-semibold hover:underline"
            >
              Lihat Semua →
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : pesananBaru.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada pesanan menunggu. ✅</p>
          ) : (
            <div className="space-y-2">
              {pesananBaru.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-yellow-50/50 rounded-xl px-3 py-2">
                  <div>
                    <p className="font-medium text-gray-700">{p.nama_pasien}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.alamat_pengiriman}</p>
                  </div>
                  <span className="text-[#29795a] font-semibold text-xs">{formatRupiah(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stok Kritis */}
        <div className="bg-white/30 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">⚠️ Stok Mendekati Minimum</h3>
            <button
              onClick={() => navigate("/stok-kadaluarsa")}
              className="text-xs text-[#29795a] font-semibold hover:underline"
            >
              Lihat Semua →
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : stokKritis.length === 0 ? (
            <p className="text-sm text-gray-500">Semua stok dalam kondisi aman. ✅</p>
          ) : (
            <div className="space-y-2">
              {stokKritis.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-red-50/50 rounded-xl px-3 py-2">
                  <p className="font-medium text-gray-700 truncate max-w-[200px]">{o.nama_obat}</p>
                  <div className="text-right">
                    <p className="text-red-500 font-bold text-xs">Stok: {o.stok}</p>
                    <p className="text-gray-400 text-xs">Min: {o.stok_minimum}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}