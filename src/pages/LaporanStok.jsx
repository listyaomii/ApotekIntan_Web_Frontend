import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { Download, FileText, ArrowUp, ArrowDown } from "lucide-react";
import * as obatService from "../services/obatService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const exportCsv = (header, rows, fileName) => {
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const ITEMS_PER_PAGE = 10;

// Status "Perlu Restock" langsung diambil dari flag backend (is_expired / is_low_stock),
// sama seperti yang dipakai di halaman Stok Kadaluarsa & Stok Minimum (endpoint /obat/status-stok).
// Ini memastikan kedua halaman selalu konsisten karena sumber kebenarannya satu: backend.
const isPerluRestock = (row) => Boolean(row.is_expired) || Boolean(row.is_low_stock);

export default function LaporanStok() {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStok, setFilterStok] = useState("semua");
  const [stokData, setStokData] = useState([]); // seluruh data (semua halaman digabung)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // halaman tampilan (frontend), bukan dari backend
  const [stokSort, setStokSort] = useState(null); // null | "asc" | "desc"
  const [expiredSort, setExpiredSort] = useState(null); // null | "asc" | "desc"
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "owner") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Ambil SEMUA halaman dari backend (karena laporanStok() masih hardcode 10 per page)
  // lalu digabung jadi satu array utuh, supaya search/filter akurat untuk semua data.
  const fetchLaporanStok = async () => {
    setLoading(true);
    setError(null);
    try {
      let page = 1;
      let allData = [];
      let lastPageFromApi = 1;

      do {
        const response = await obatService.getLaporanStok({ page });
        const data = Array.isArray(response) ? response : response?.data ?? [];

        allData = allData.concat(
          data.map((item) => ({
            id: item.id_obat ?? "-",
            nama: item.nama_obat ?? "-",
            kategori: item.nama_kategori ?? "-",
            stok: Number(item.stok ?? 0),
            stok_minimum: Number(item.stok_minimum ?? 0),
            expired: item.tgl_kadaluarsa ?? "-",
            is_expired: Boolean(item.is_expired),
            is_low_stock: Boolean(item.is_low_stock),
          }))
        );

        lastPageFromApi = response?.last_page ?? 1;
        page += 1;
      } while (page <= lastPageFromApi);

      setStokData(allData);
      setCurrentPage(1);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Gagal memuat laporan stok.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanStok();
  }, []);

  // Klik header Stok: toggle asc -> desc -> default, nonaktifkan sort Expired
  const handleStokSortClick = () => {
    setExpiredSort(null);
    if (stokSort === null) setStokSort("asc");
    else if (stokSort === "asc") setStokSort("desc");
    else setStokSort(null);
  };

  // Klik header Expired: toggle asc -> desc -> default, nonaktifkan sort Stok
  const handleExpiredSortClick = () => {
    setStokSort(null);
    if (expiredSort === null) setExpiredSort("asc");
    else if (expiredSort === "asc") setExpiredSort("desc");
    else setExpiredSort(null);
  };

  const filteredStok = useMemo(() => {
    const filtered = stokData.filter((row) => {
      const matchSearch = search
        ? row.nama.toLowerCase().includes(search.toLowerCase()) ||
          row.kategori.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchFilter =
        filterStok === "semua"
          ? true
          : filterStok === "kritis"
          ? isPerluRestock(row)
          : !isPerluRestock(row);

      return matchSearch && matchFilter;
    });

    if (stokSort) {
      filtered.sort((a, b) => {
        const comparison = a.stok - b.stok;
        return stokSort === "asc" ? comparison : -comparison;
      });
    } else if (expiredSort) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.expired === "-" ? "2099-12-31" : a.expired);
        const dateB = new Date(b.expired === "-" ? "2099-12-31" : b.expired);
        const comparison = dateA - dateB;
        return expiredSort === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [search, stokData, filterStok, stokSort, expiredSort]);

  // Reset ke halaman 1 setiap kali search/filter/sort berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStok, stokSort, expiredSort]);

  const lastPage = Math.max(1, Math.ceil(filteredStok.length / ITEMS_PER_PAGE));

  const paginatedStok = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStok.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStok, currentPage]);

  const handleExport = () => {
    exportCsv(
      ["No", "Nama Obat", "Kategori", "Stok", "Stok Minimum", "Expired", "Status"],
      filteredStok.map((row, index) => [
        index + 1,
        row.nama,
        row.kategori,
        row.stok,
        row.stok_minimum,
        row.expired,
        isPerluRestock(row) ? "Perlu Restock" : "Aman",
      ]),
      "laporan_stok_obat"
    );
  };
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Judul
    doc.setFontSize(14);
    doc.text("Laporan Stok Obat", 14, 15);

    doc.setFontSize(10);
    doc.text(`Tanggal cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 21);
    doc.text(`Total data: ${filteredStok.length} obat`, 14, 26);

    // Tabel
    autoTable(doc, {
      startY: 32,
      head: [["No", "Nama Obat", "Kategori", "Stok", "Stok Minimum", "Expired", "Status"]],
      body: filteredStok.map((row, index) => [
        index + 1,
        row.nama,
        row.kategori,
        row.stok,
        row.stok_minimum,
        row.expired,
        isPerluRestock(row) ? "Perlu Restock" : "Aman",
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 121, 90], textColor: 255, fontStyle: "bold" },
      didParseCell: (data) => {
        // Kasih warna merah pada baris yang stoknya kritis atau kadaluarsa
        if (data.section === "body" && data.row.raw[6] === "Perlu Restock") {
          data.cell.styles.textColor = [200, 30, 30];
        }
      },
    });

    doc.save("laporan_stok_obat.pdf");
  };

  const jumlahKritis = stokData.filter((r) => isPerluRestock(r)).length;
  const jumlahAman = stokData.filter((r) => !isPerluRestock(r)).length;

  return (
    <PageShell
      title="Laporan Stok Obat"
      subtitle="Lihat stok obat dan ekspor data stok secara cepat."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="laporan-stok"
      rightSlot={
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#29795a] px-5 py-3 text-white hover:bg-[#2f8d6b] transition"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#c0392b] px-5 py-3 text-white hover:bg-[#e74c3c] transition"
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      }
    >
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">

        {/* Filter */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Cari</label>
            <input
              type="text"
              placeholder="Cari nama atau kategori obat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/80 px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status Stok</label>
            <select
              value={filterStok}
              onChange={(e) => setFilterStok(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/80 px-4 py-3"
            >
              <option value="semua">Semua</option>
              <option value="kritis">⚠️ Perlu Restock</option>
              <option value="aman">✅ Stok Aman</option>
            </select>
          </div>
        </div>

        {/* Badge Ringkasan */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="bg-red-100/50 border border-red-300 rounded-2xl px-4 py-2 text-sm text-red-700 font-medium">
            ⚠️ Perlu Restock: {jumlahKritis} obat
          </div>
          <div className="bg-green-100/50 border border-green-300 rounded-2xl px-4 py-2 text-sm text-green-700 font-medium">
            ✅ Stok Aman: {jumlahAman} obat
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="min-w-full w-full table-auto border-collapse text-left text-sm">
            <thead className="border-b border-white/20 bg-white/10 text-gray-600">
              <tr>
                <th className="p-4">No</th>
                <th className="p-4">Nama Obat</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">
                  <button
                    onClick={handleStokSortClick}
                    className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer"
                  >
                    Stok
                    {stokSort === "asc" && <ArrowUp size={14} className="text-blue-600" />}
                    {stokSort === "desc" && <ArrowDown size={14} className="text-blue-600" />}
                  </button>
                </th>
                <th className="p-4">Stok Minimum</th>
                <th className="p-4">
                  <button
                    onClick={handleExpiredSortClick}
                    className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer"
                  >
                    Expired
                    {expiredSort === "asc" && <ArrowUp size={14} className="text-blue-600" />}
                    {expiredSort === "desc" && <ArrowDown size={14} className="text-blue-600" />}
                  </button>
                </th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-600">
                    Memuat laporan stok...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : paginatedStok.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-600">
                    Tidak ada data stok obat.
                  </td>
                </tr>
              ) : (
                paginatedStok.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-white/10 hover:bg-white/10 transition ${
                      isPerluRestock(row) ? "bg-red-100/30" : ""
                    }`}
                  >
                    <td className="p-4">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="p-4">{row.nama}</td>
                    <td className="p-4">{row.kategori}</td>
                    <td className={`p-4 font-semibold ${isPerluRestock(row) ? "text-red-500" : "text-green-600"}`}>
                      {row.stok}
                    </td>
                    <td className="p-4">{row.stok_minimum}</td>
                    <td className="p-4">{row.expired}</td>
                    <td className="p-4">
                      {isPerluRestock(row) ? (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (dihitung dari filteredStok di frontend) */}
        {lastPage > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-4 py-2 rounded-2xl bg-white/70 text-gray-800 font-semibold hover:bg-white transition disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {lastPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              disabled={currentPage >= lastPage || loading}
              className="px-4 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}