import { useState, useEffect } from "react";
import PageShell from "../components/PageShell";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const STATUS_FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "kadaluarsa", label: "Kadaluarsa" },
  { key: "stok_minimum", label: "Stok Minimum" },
];

export default function StokKadaluarsa() {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_URL}/obat/status-stok`, {
          withCredentials: true,
        });
        const data = response.data ?? [];
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching status stok:", err);
        setError("Gagal memuat data obat kadaluarsa / stok minimum.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRupiah = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

  const totalKadaluarsa = items.filter((item) => item.is_expired).length;
  const totalStokMinimum = items.filter((item) => item.is_low_stock).length;

  const filteredItems = items
    .filter((item) => {
      if (statusFilter === "kadaluarsa") return item.is_expired;
      if (statusFilter === "stok_minimum") return item.is_low_stock;
      return true; // semua
    })
    .filter((item) =>
      (item.nama_obat || item.nama || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.nama_kategori || item.kategori || "").toLowerCase().includes(search.toLowerCase())
    );

  return (
    <PageShell
      title="Stok Kadaluarsa & Stok Minimum"
      subtitle="Pantau obat yang sudah kadaluarsa atau stoknya sudah di bawah batas minimum."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="stok-kadaluarsa"
      rightSlot={null}
    >
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="flex items-center gap-4 bg-red-50/80 border border-red-200 rounded-3xl px-6 py-4">
          <div className="w-12 h-12 rounded-2xl bg-red-400 flex items-center justify-center text-white text-xl font-bold shrink-0">
            !
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Kadaluarsa</p>
            <p className="text-3xl font-bold text-red-500">
              {loading ? "..." : totalKadaluarsa}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-amber-50/80 border border-amber-200 rounded-3xl px-6 py-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-white text-xl font-bold shrink-0">
            ⚠
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Stok Minimum</p>
            <p className="text-3xl font-bold text-amber-500">
              {loading ? "..." : totalStokMinimum}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Status + Search */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/20 rounded-3xl px-6 py-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                  statusFilter === f.key
                    ? "bg-[#29795a] text-white"
                    : "bg-white/30 text-gray-700 hover:bg-white/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Cari nama atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 rounded-2xl border border-white/20 bg-white/80 px-4 py-3"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/20 bg-white/10 text-gray-600">
              <tr>
                <th className="p-4">No</th>
                <th className="p-4">Nama Obat</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Stok</th>
                <th className="p-4">Stok Minimum</th>
                <th className="p-4">Tgl Kadaluarsa</th>
                <th className="p-4">Harga Jual</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center text-gray-600">Memuat data...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center text-red-600">{error}</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center text-gray-600">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={item.id_obat || item.id}
                    className="border-b border-white/10 hover:bg-red-50/30 transition"
                  >
                    <td className="p-4 text-gray-500">{index + 1}</td>
                    <td className="p-4 font-semibold">{item.nama_obat || item.nama}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        {item.nama_kategori || item.kategori}
                      </span>
                    </td>

                    <td className={`p-4 font-semibold ${item.is_low_stock ? "text-amber-600" : ""}`}>
                      {item.stok ?? 0}
                    </td>
                    <td className="p-4 text-gray-500">{item.stok_minimum ?? "-"}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-red-200 text-red-800 text-xs font-medium">
                        {item.tgl_kadaluarsa || item.expired}
                      </span>
                    </td>
                    <td className="p-4">{formatRupiah(item.harga_jual || item.harga)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.is_expired && (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-300">
                            Kadaluarsa
                          </span>
                        )}
                        {item.is_low_stock && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-300">
                            Stok Minimum
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}