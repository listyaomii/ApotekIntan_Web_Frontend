import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { Download } from "lucide-react";

const laporanPenjualanDummy = [
  { id: "S1", tanggal: "20-05-2026", pelanggan: "Budi", total: 175000, items: 3 },
  { id: "S2", tanggal: "19-05-2026", pelanggan: "Siti", total: 86000, items: 2 },
  { id: "S3", tanggal: "17-05-2026", pelanggan: "Joko", total: 132000, items: 4 },
];

const laporanPembelianDummy = [
  { id: "P1", tanggal: "18-05-2026", supplier: "CV Intan Farma", total: 120000, items: 5 },
  { id: "P2", tanggal: "15-05-2026", supplier: "PT Surya Medika", total: 98000, items: 3 },
  { id: "P3", tanggal: "12-05-2026", supplier: "UD Cahaya Obat", total: 143000, items: 6 },
];

const laporanStokDummy = [
  { id: "O1", nama: "Paracetamol", kategori: "Obat Umum", stok: 34, expired: "12-06-2026" },
  { id: "O2", nama: "Amoxicillin", kategori: "Antibiotik", stok: 12, expired: "08-07-2026" },
  { id: "O3", nama: "Vitamin C", kategori: "Suplemen", stok: 45, expired: "10-10-2026" },
];

const formatRupiah = (value) => `Rp ${Number(value).toLocaleString("id-ID")}`;

const toDate = (dateString) => new Date(dateString.split("-").reverse().join("-")).getTime();

const exportCsv = (header, rows, fileName) => {
  const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function LaporanSemua() {
  const [isOpen, setIsOpen] = useState(true);
  const [tab, setTab] = useState("penjualan");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "owner") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const filteredPenjualan = useMemo(() => {
    return laporanPenjualanDummy.filter((row) => {
      const matchesSearch = search
        ? row.id.toLowerCase().includes(search.toLowerCase()) ||
          row.pelanggan.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStart = startDate ? toDate(row.tanggal) >= new Date(startDate).getTime() : true;
      const matchesEnd = endDate ? toDate(row.tanggal) <= new Date(endDate).getTime() : true;
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [search, startDate, endDate]);

  const filteredPembelian = useMemo(() => {
    return laporanPembelianDummy.filter((row) => {
      const matchesSearch = search
        ? row.id.toLowerCase().includes(search.toLowerCase()) ||
          row.supplier.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStart = startDate ? toDate(row.tanggal) >= new Date(startDate).getTime() : true;
      const matchesEnd = endDate ? toDate(row.tanggal) <= new Date(endDate).getTime() : true;
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [search, startDate, endDate]);

  const filteredStok = useMemo(() => {
    return laporanStokDummy.filter((row) => {
      const matchesSearch = search
        ? row.nama.toLowerCase().includes(search.toLowerCase()) ||
          row.kategori.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesSearch;
    });
  }, [search]);

  const currentCount = tab === "penjualan" ? filteredPenjualan.length : tab === "pembelian" ? filteredPembelian.length : filteredStok.length;

  const handleExport = () => {
    if (tab === "penjualan") {
      exportCsv(
        ["No", "ID", "Tanggal", "Pelanggan", "Jumlah Item", "Total"],
        filteredPenjualan.map((row, index) => [index + 1, row.id, row.tanggal, row.pelanggan, row.items, row.total]),
        "laporan_penjualan"
      );
    }
    if (tab === "pembelian") {
      exportCsv(
        ["No", "ID", "Tanggal", "Supplier", "Jumlah Item", "Total"],
        filteredPembelian.map((row, index) => [index + 1, row.id, row.tanggal, row.supplier, row.items, row.total]),
        "laporan_pembelian"
      );
    }
    if (tab === "stok") {
      exportCsv(
        ["No", "ID", "Nama Obat", "Kategori", "Stok", "Expired"],
        filteredStok.map((row, index) => [index + 1, row.id, row.nama, row.kategori, row.stok, row.expired]),
        "laporan_stok_obat"
      );
    }
  };

  const tabName = tab === "penjualan" ? "Penjualan" : tab === "pembelian" ? "Pembelian" : "Stok Obat";
  const description =
    tab === "penjualan"
      ? "Lihat ringkasan transaksi penjualan dan ekspor laporan penjualan."
      : tab === "pembelian"
      ? "Lihat ringkasan transaksi pembelian dan ekspor laporan pembelian."
      : "Lihat stok obat saat ini dan ekspor laporan stok.";

  return (
    <PageShell
      title="Laporan Semua"
      subtitle="Akses laporan lengkap hanya untuk owner, termasuk penjualan, pembelian, dan stok obat."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="laporan-semua"
      rightSlot={
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#29795a] px-5 py-3 text-white hover:bg-[#2f8d6b] transition"
        >
          <Download size={16} /> Export Excel
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div>
          <p className="text-lg text-[#29795a]">{tabName}</p>
          <h1 className="text-3xl font-bold">{description}</h1>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { key: "penjualan", label: "Laporan Penjualan" },
          { key: "pembelian", label: "Laporan Pembelian" },
          { key: "stok", label: "Laporan Stok Obat" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-3xl border px-4 py-3 text-sm font-medium transition ${
              tab === item.key
                ? "border-[#29795a] bg-[#29795a] text-white"
                : "border-white/20 bg-white/10 text-[#071307] hover:border-[#8cce90] hover:bg-white/20"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Cari</label>
            <input
              type="text"
              placeholder="Cari sesuai laporan"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/80 px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/80 px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/80 px-4 py-3"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {tab === "penjualan" && (
            <table className="min-w-full w-full table-auto border-collapse text-left text-sm">
              <thead className="border-b border-white/20 bg-white/10 text-gray-600">
                <tr>
                  <th className="p-4">No</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Jumlah Item</th>
                  <th className="p-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenjualan.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-600">
                      Tidak ada laporan penjualan.
                    </td>
                  </tr>
                ) : (
                  filteredPenjualan.map((row, index) => (
                    <tr key={row.id} className="border-b border-white/10 hover:bg-white/10 transition">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4">{row.id}</td>
                      <td className="p-4">{row.tanggal}</td>
                      <td className="p-4">{row.pelanggan}</td>
                      <td className="p-4">{row.items}</td>
                      <td className="p-4">{formatRupiah(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === "pembelian" && (
            <table className="min-w-full w-full table-auto border-collapse text-left text-sm">
              <thead className="border-b border-white/20 bg-white/10 text-gray-600">
                <tr>
                  <th className="p-4">No</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Jumlah Item</th>
                  <th className="p-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredPembelian.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-600">
                      Tidak ada laporan pembelian.
                    </td>
                  </tr>
                ) : (
                  filteredPembelian.map((row, index) => (
                    <tr key={row.id} className="border-b border-white/10 hover:bg-white/10 transition">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4">{row.id}</td>
                      <td className="p-4">{row.tanggal}</td>
                      <td className="p-4">{row.supplier}</td>
                      <td className="p-4">{row.items}</td>
                      <td className="p-4">{formatRupiah(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === "stok" && (
            <table className="min-w-full w-full table-auto border-collapse text-left text-sm">
              <thead className="border-b border-white/20 bg-white/10 text-gray-600">
                <tr>
                  <th className="p-4">No</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Nama Obat</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Stok</th>
                  <th className="p-4">Expired</th>
                </tr>
              </thead>
              <tbody>
                {filteredStok.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-600">
                      Tidak ada data stok obat.
                    </td>
                  </tr>
                ) : (
                  filteredStok.map((row, index) => (
                    <tr key={row.id} className="border-b border-white/10 hover:bg-white/10 transition">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4">{row.id}</td>
                      <td className="p-4">{row.nama}</td>
                      <td className="p-4">{row.kategori}</td>
                      <td className="p-4">{row.stok}</td>
                      <td className="p-4">{row.expired}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 rounded-3xl bg-[#effaf0]/80 p-5 border border-[#c6efcf] text-[#13492c] shadow-sm">
          <p className="text-sm text-gray-600">Laporan aktif: {tabName}</p>
          <p className="mt-3 text-lg font-semibold">Total Baris: {currentCount}</p>
          <p className="mt-2 text-sm text-gray-600">Data ini hanya bisa diakses oleh pegawai role owner.</p>
        </div>
      </div>
    </PageShell>
  );
}
