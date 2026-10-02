import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import * as penjualanService from "../services/penjualanService";
import * as obatService from "../services/obatService";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const formatRupiah = (value) => {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
};

const formatLabel = (label, periode) => {
  if (!label) return "-";
  if (periode === "bulanan") {
    const [year, month] = label.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    return `${months[parseInt(month) - 1]} ${year}`;
  }
  if (periode === "mingguan") {
    const date = new Date(label);
    return `Minggu ${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;
  }
  const date = new Date(label);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

const getDefaultDates = (periode) => {
  const end = new Date();
  const start = new Date();
  if (periode === "harian") start.setDate(end.getDate() - 13);
  else if (periode === "mingguan") start.setDate(end.getDate() - 56);
  else if (periode === "bulanan") start.setMonth(end.getMonth() - 11);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

// Sama seperti di LaporanStok.jsx: obat perlu restock kalau kadaluarsa ATAU stok di bawah minimum.
// Diambil dari flag backend (is_expired / is_low_stock) supaya konsisten di semua halaman.
const isPerluRestock = (row) => Boolean(row.is_expired) || Boolean(row.is_low_stock);

export default function GrafikPenjualan() {
  const [isOpen, setIsOpen]       = useState(true);
  const [periode, setPeriode]     = useState("harian");
  const [chartType, setChartType] = useState("line");
  const [mode, setMode]           = useState("penjualan"); // "penjualan" | "laba"
  const [startDate, setStartDate] = useState(getDefaultDates("harian").start);
  const [endDate, setEndDate]     = useState(getDefaultDates("harian").end);

  const [dataPenjualan, setDataPenjualan] = useState([]);
  const [dataLaba, setDataLaba]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  const [obatKritis, setObatKritis] = useState([]);
  const [showAlert, setShowAlert]   = useState(false);

  const navigate = useNavigate();

  // Fetch grafik penjualan
  const fetchGrafik = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await penjualanService.getGrafikPenjualan({
        periode,
        start_date: startDate,
        end_date: endDate,
      });
      const raw = Array.isArray(res) ? res : [];
      setDataPenjualan(raw.map((item) => ({
        label: formatLabel(item.label, periode),
        total: Number(item.total ?? 0),
      })));
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data grafik penjualan.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch grafik laba
  const fetchLaba = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/penjualan/grafik-laba`, {
        params: { periode, start_date: startDate, end_date: endDate },
      });
      const raw = Array.isArray(res.data) ? res.data : [];
      setDataLaba(raw.map((item) => ({
        label:           formatLabel(item.label, periode),
        total_penjualan: Number(item.total_penjualan ?? 0),
        total_modal:     Number(item.total_modal ?? 0),
        total_laba:      Number(item.total_laba ?? 0),
      })));
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data grafik laba.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const defaults = getDefaultDates(periode);
    setStartDate(defaults.start);
    setEndDate(defaults.end);
  }, [periode]);

  useEffect(() => {
    if (mode === "penjualan") fetchGrafik();
    else fetchLaba();
  }, [mode, periode, startDate, endDate]);

  // Cek stok kritis: ambil SEMUA halaman (bukan cuma page 1) dan pakai kriteria
  // yang sama dengan Laporan Stok Obat (kadaluarsa ATAU stok minimum).
  useEffect(() => {
    const cekStokKritis = async () => {
      try {
        let page = 1;
        let allData = [];
        let lastPageFromApi = 1;

        do {
          const response = await obatService.getLaporanStok({ page });
          const data = Array.isArray(response) ? response : response?.data ?? [];
          allData = allData.concat(data);
          lastPageFromApi = response?.last_page ?? 1;
          page += 1;
        } while (page <= lastPageFromApi);

        const kritis = allData.filter(isPerluRestock);
        if (kritis.length > 0) {
          setObatKritis(kritis);
          setShowAlert(true);
        }
      } catch (err) {
        console.error("Gagal cek stok kritis:", err);
      }
    };
    cekStokKritis();
  }, []);

  // Summary penjualan
  const totalPenjualan = dataPenjualan.reduce((s, d) => s + d.total, 0);
  const tertinggiPenjualan = dataPenjualan.length > 0 ? Math.max(...dataPenjualan.map((d) => d.total)) : 0;

  // Summary laba
  const totalLaba      = dataLaba.reduce((s, d) => s + d.total_laba, 0);
  const totalModal     = dataLaba.reduce((s, d) => s + d.total_modal, 0);
  const totalOmzet     = dataLaba.reduce((s, d) => s + d.total_penjualan, 0);

  const jumlahData = mode === "penjualan" ? dataPenjualan.length : dataLaba.length;
  const satuanPeriode = periode === "harian" ? "hari" : periode === "mingguan" ? "minggu" : "bulan";

  return (
    <PageShell
      title="Grafik Penjualan & Laba"
      subtitle="Pantau tren penjualan dan laba bersih berdasarkan periode yang dipilih."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="grafik-penjualan"
      rightSlot={null}
    >
      {/* Alert stok kritis */}
      {showAlert && (
        <div className="bg-red-100/70 border border-red-400 rounded-3xl p-5 mb-6 flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/laporan-stok")}
            className="text-left flex-1 cursor-pointer group"
          >
            <p className="font-semibold text-red-700 text-sm mb-1 group-hover:underline">
              ⚠️ {obatKritis.length} obat perlu segera direstock!
            </p>
            <p className="text-xs text-red-600">
              Klik untuk melihat detail lengkapnya di halaman <strong>Laporan Stok Obat</strong>.
            </p>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAlert(false);
            }}
            className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toggle Mode */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("penjualan")}
          className={`px-5 py-2 rounded-2xl text-sm font-semibold transition ${
            mode === "penjualan"
              ? "bg-[#29795a] text-white shadow"
              : "bg-white/30 text-gray-700 hover:bg-white/50"
          }`}
        >
          📈 Grafik Penjualan
        </button>
        <button
          onClick={() => setMode("laba")}
          className={`px-5 py-2 rounded-2xl text-sm font-semibold transition ${
            mode === "laba"
              ? "bg-[#29795a] text-white shadow"
              : "bg-white/30 text-gray-700 hover:bg-white/50"
          }`}
        >
          💰 Grafik Laba Bersih
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 mb-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-2">Periode</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
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
          <div>
            <label className="block text-sm font-medium mb-2">Tipe Grafik</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
            >
              <option value="line">Garis</option>
              <option value="bar">Batang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {mode === "penjualan" ? (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="bg-white/20 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg">
            <p className="text-sm text-gray-600">Total Penjualan</p>
            <p className="text-2xl font-bold mt-1 text-[#29795a]">{formatRupiah(totalPenjualan)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg">
            <p className="text-sm text-gray-600">Penjualan Tertinggi</p>
            <p className="text-2xl font-bold mt-1 text-[#29795a]">{formatRupiah(tertinggiPenjualan)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg">
            <p className="text-sm text-gray-600">Jumlah Data</p>
            <p className="text-2xl font-bold mt-1 text-[#29795a]">{jumlahData} {satuanPeriode}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="bg-white/20 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg">
            <p className="text-sm text-gray-600">Total Omzet</p>
            <p className="text-3xl font-bold mt-1 text-[#29795a]">{formatRupiah(totalOmzet)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg">
            <p className="text-sm text-gray-600">Total Modal</p>
            <p className="text-3xl font-bold mt-1 text-orange-500">{formatRupiah(totalModal)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-lg">
            <p className="text-sm text-gray-600">Laba Bersih</p>
            <p className={`text-3xl font-bold mt-1 ${totalLaba >= 0 ? "text-[#29795a]" : "text-red-500"}`}>
              {formatRupiah(totalLaba)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
        <h2 className="text-lg font-semibold mb-6">
          {mode === "penjualan" ? "Grafik Penjualan" : "Grafik Laba Bersih"}{" "}
          {periode === "harian" ? "Harian" : periode === "mingguan" ? "Mingguan" : "Bulanan"}
        </h2>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">Memuat grafik...</div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500">{error}</div>
        ) : (mode === "penjualan" ? dataPenjualan : dataLaba).length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">Tidak ada data pada rentang tanggal ini.</div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {mode === "penjualan" ? (
                chartType === "line" ? (
                  <LineChart data={dataPenjualan}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Penjualan"]} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Penjualan" stroke="#29795a" strokeWidth={3} dot={{ fill: "#29795a", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <BarChart data={dataPenjualan}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Penjualan"]} />
                    <Legend />
                    <Bar dataKey="total" name="Penjualan" fill="#29795a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )
              ) : (
                chartType === "line" ? (
                  <LineChart data={dataLaba}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name) => [`Rp ${Number(value).toLocaleString("id-ID")}`, name]} />
                    <Legend />
                    <Line type="monotone" dataKey="total_penjualan" name="Omzet" stroke="#29795a" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="total_modal" name="Modal" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="total_laba" name="Laba Bersih" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <BarChart data={dataLaba}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name) => [`Rp ${Number(value).toLocaleString("id-ID")}`, name]} />
                    <Legend />
                    <Bar dataKey="total_penjualan" name="Omzet" fill="#29795a" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="total_modal" name="Modal" fill="#fb923c" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="total_laba" name="Laba Bersih" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </PageShell>
  );
}