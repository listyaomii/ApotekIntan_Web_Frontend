import { useState, useEffect } from "react";
import PageShell from "../components/PageShell";
import { Download } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const formatRupiah = (value) => `Rp ${Number(value).toLocaleString("id-ID")}`;

const pad = (n) => String(n).padStart(2, "0");
const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTanggal = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Hitung range tanggal default berdasarkan periode
const getDateRange = (periode) => {
  const today = new Date();

  if (periode === "harian") {
    const iso = toISODate(today);
    return { start: iso, end: iso };
  }

  if (periode === "mingguan") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6); // 7 hari termasuk hari ini
    return { start: toISODate(start), end: toISODate(today) };
  }

  // bulanan -> bulan yang sedang berjalan, tanggal 1 s/d akhir bulan
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
};

const exportCsv = (data) => {
  const header = ["No", "Nama Obat", "Total Terjual", "Total Omzet", "Stok Sekarang", "Stok Minimum", "Status"];
  const rows = data.map((row, i) => [
    i + 1,
    row.nama_obat,
    row.total_terjual,
    `Rp ${Number(row.total_omzet).toLocaleString("id-ID")}`,
    row.stok,
    row.stok_minimum,
    Number(row.stok) <= Number(row.stok_minimum) ? "Perlu Restock" : "Aman",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "obat_terlaris.csv";
  link.click();
  URL.revokeObjectURL(url);
};

export default function ObatTerlaris() {
  const [isOpen, setIsOpen] = useState(true);

  const defaultRange = getDateRange("harian");

  const [periode, setPeriode]     = useState("harian");
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate]     = useState(defaultRange.end);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const fetchData = async (range) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/detail-penjualan/terlaris-periode`, {
        params: { periode, start_date: range.start, end_date: range.end },
      });
      setData(Array.isArray(res.data) ? res.data : []);
      setAppliedRange(range);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data obat terlaris.");
    } finally {
      setLoading(false);
    }
  };

  // Load awal saat halaman dibuka
  useEffect(() => {
    fetchData(defaultRange);
  }, []);

  // Ganti periode -> isi ulang Dari/Sampai Tanggal dengan default periode tersebut
  // (belum fetch, nunggu user klik Apply)
  const handlePeriodeChange = (newPeriode) => {
    setPeriode(newPeriode);
    const range = getDateRange(newPeriode);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const handleApply = () => {
    if (!startDate || !endDate) {
      setError("Tanggal mulai dan tanggal akhir wajib diisi.");
      return;
    }
    if (startDate > endDate) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.");
      return;
    }
    fetchData({ start: startDate, end: endDate });
  };

  return (
    <PageShell
      title="Obat Terlaris"
      subtitle="Top 10 obat yang paling sering dibeli dalam periode tertentu."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="obat-terlaris"
      rightSlot={
        <button
          onClick={() => exportCsv(data)}
          disabled={data.length === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#29795a] px-5 py-3 text-white hover:bg-[#2f8d6b] transition disabled:opacity-50"
        >
          <Download size={16} /> Export CSV
        </button>
      }
    >
      {/* Filter */}
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Periode</label>
            <select
              value={periode}
              onChange={(e) => handlePeriodeChange(e.target.value)}
              className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
            >
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan</option>
              <option value="bulanan">Bulanan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
          <button
            onClick={handleApply}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#29795a] px-6 py-3 text-white hover:bg-[#2f8d6b] transition disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
        <h2 className="text-lg font-semibold mb-4">
          Top 10 Obat Terlaris —{" "}
          <span className="text-[#29795a]">
            {appliedRange.start === appliedRange.end
              ? formatTanggal(appliedRange.start)
              : `${formatTanggal(appliedRange.start)} - ${formatTanggal(appliedRange.end)}`}
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="border-b border-white/20 bg-white/10 text-gray-600">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Nama Obat</th>
                <th className="p-4">Total Terjual</th>
                <th className="p-4">Total Omzet</th>
                <th className="p-4">Stok Sekarang</th>
                <th className="p-4">Stok Minimum</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    Tidak ada data pada rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const perluRestock = Number(row.stok) <= Number(row.stok_minimum);
                  return (
                    <tr
                      key={row.id_obat}
                      className={`border-b border-white/10 hover:bg-white/10 transition ${
                        perluRestock ? "bg-red-100/20" : ""
                      }`}
                    >
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? "bg-yellow-400 text-white" :
                          index === 1 ? "bg-gray-300 text-gray-700" :
                          index === 2 ? "bg-orange-400 text-white" :
                          "bg-white/30 text-gray-600"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{row.nama_obat}</td>
                      <td className="p-4 font-semibold text-[#29795a]">
                        {Number(row.total_terjual).toLocaleString("id-ID")} item
                      </td>
                      <td className="p-4">{formatRupiah(row.total_omzet)}</td>
                      <td className={`p-4 font-semibold ${perluRestock ? "text-red-500" : "text-green-600"}`}>
                        {row.stok}
                      </td>
                      <td className="p-4">{row.stok_minimum}</td>
                      <td className="p-4">
                        {perluRestock ? (
                          <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-300">
                            ⚠️ Perlu Restock
                          </span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-300">
                            ✅ Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}