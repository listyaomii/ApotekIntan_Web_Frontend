import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import * as penjualanService from "../services/penjualanService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatRupiah = (value) => `Rp ${Number(value).toLocaleString("id-ID")}`;

const toDate = (dateString) => {
  if (!dateString) return NaN;
  return new Date(dateString).getTime();
};

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

export default function LaporanPenjualan() {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [laporanPenjualan, setLaporanPenjualan] = useState([]); // seluruh data (semua halaman digabung)
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // halaman tampilan (frontend)
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "owner") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Ambil SEMUA halaman dari backend, gabung jadi satu array utuh,
  // supaya search/filter/export akurat untuk semua data.
  const loadPenjualan = async () => {
    setLoading(true);
    try {
      let page = 1;
      let allData = [];
      let lastPageFromApi = 1;

      do {
        const response = await penjualanService.getLaporanPenjualan({ page });
        const data = Array.isArray(response) ? response : response?.data ?? [];

        const normalized = data.map((item) => ({
          id: item.id_penjualan ?? "",
          tanggal: item.tgl_jual ?? "",
          pelanggan: item.nama_pasien ?? "Pasien Umum",
          total: Number(item.total ?? 0),
          detail: (item.detail_penjualan ?? item.detailPenjualan ?? []).map((d) => ({
            nama_obat: d.obat?.nama_obat ?? "-",
            jumlah: d.jumlah ?? 0,
            harga_satuan: Number(d.harga_satuan ?? 0),
            subtotal: Number(d.subtotal ?? 0),
          })),
        }));

        allData = allData.concat(normalized);
        lastPageFromApi = response?.last_page ?? 1;
        page += 1;
      } while (page <= lastPageFromApi);

      setLaporanPenjualan(allData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Gagal memuat laporan penjualan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPenjualan();
  }, []);

  const filteredPenjualan = useMemo(() => {
    return laporanPenjualan.filter((row) => {
      const matchesSearch = search
        ? String(row.id).includes(search) ||
          row.pelanggan.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStart = startDate ? toDate(row.tanggal) >= new Date(startDate).getTime() : true;
      const matchesEnd = endDate ? toDate(row.tanggal) <= new Date(endDate).getTime() : true;
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [laporanPenjualan, search, startDate, endDate]);

  // Reset ke halaman 1 setiap kali search/filter tanggal berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const lastPage = Math.max(1, Math.ceil(filteredPenjualan.length / ITEMS_PER_PAGE));

  const paginatedPenjualan = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPenjualan.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPenjualan, currentPage]);

  const handleExport = () => {
    const rows = [];
    filteredPenjualan.forEach((row, index) => {
      row.detail.forEach((d, di) => {
        rows.push([
          di === 0 ? index + 1 : "",
          di === 0 ? row.id : "",
          di === 0 ? row.tanggal : "",
          di === 0 ? row.pelanggan : "",
          d.nama_obat,
          d.jumlah,
          d.harga_satuan,
          d.subtotal,
          di === 0 ? row.total : "",
        ]);
      });
      if (row.detail.length === 0) {
        rows.push([index + 1, row.id, row.tanggal, row.pelanggan, "-", 0, 0, 0, row.total]);
      }
    });
    exportCsv(
      ["No", "ID", "Tanggal", "Pelanggan", "Nama Obat", "Jumlah", "Harga Satuan", "Subtotal", "Total"],
      rows,
      "laporan_penjualan"
    );
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Judul
    doc.setFontSize(14);
    doc.text("Laporan Penjualan", 14, 15);

    doc.setFontSize(10);
    doc.text(`Tanggal cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 21);
    doc.text(`Total transaksi: ${filteredPenjualan.length}`, 14, 26);
    if (startDate || endDate) {
      doc.text(
        `Periode: ${startDate ? startDate : "awal"} s/d ${endDate ? endDate : "sekarang"}`,
        14,
        31
      );
    }

    // Susun rows seperti CSV: baris pertama tiap transaksi berisi ID/Tanggal/Pelanggan/Total,
    // baris item berikutnya kosong di kolom itu supaya terlihat mengelompok.
    const rows = [];
    filteredPenjualan.forEach((row, index) => {
      if (row.detail.length === 0) {
        rows.push([
          index + 1,
          row.id,
          row.tanggal,
          row.pelanggan,
          "-",
          0,
          formatRupiah(0),
          formatRupiah(0),
          formatRupiah(row.total),
        ]);
      } else {
        row.detail.forEach((d, di) => {
          rows.push([
            di === 0 ? index + 1 : "",
            di === 0 ? row.id : "",
            di === 0 ? row.tanggal : "",
            di === 0 ? row.pelanggan : "",
            d.nama_obat,
            d.jumlah,
            formatRupiah(d.harga_satuan),
            formatRupiah(d.subtotal),
            di === 0 ? formatRupiah(row.total) : "",
          ]);
        });
      }
    });

    autoTable(doc, {
      startY: startDate || endDate ? 36 : 31,
      head: [["No", "ID", "Tanggal", "Pelanggan", "Nama Obat", "Jumlah", "Harga Satuan", "Subtotal", "Total"]],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 121, 90], textColor: 255, fontStyle: "bold" },
    });

    doc.save("laporan_penjualan.pdf");
  };

  return (
    <PageShell
      title="Laporan Penjualan"
      subtitle="Pantau semua transaksi penjualan dan ekspor laporannya dalam satu klik."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="laporan-penjualan"
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
              placeholder="Cari ID atau pelanggan"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full w-full border-collapse text-left text-sm">
            <thead className="border-b border-white/20 bg-white/10 text-gray-600">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">No</th>
                <th className="p-4">ID</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Jumlah Item</th>
                <th className="p-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-600">Memuat laporan penjualan...</td>
                </tr>
              ) : paginatedPenjualan.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-600">Tidak ada laporan penjualan.</td>
                </tr>
              ) : (
                paginatedPenjualan.map((row, index) => (
                  <React.Fragment key={row.id}>
                    {/* Row utama */}
                    <tr
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                      className="border-b border-white/10 hover:bg-white/10 transition cursor-pointer"
                    >
                      <td className="p-4 text-center text-gray-500">
                        {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="p-4">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="p-4">{row.id}</td>
                      <td className="p-4 whitespace-nowrap">{row.tanggal}</td>
                      <td className="p-4">{row.pelanggan}</td>
                      <td className="p-4">{row.detail.length} item</td>
                      <td className="p-4 whitespace-nowrap font-semibold">{formatRupiah(row.total)}</td>
                    </tr>

                    {expandedId === row.id && (
                      <tr key={`detail-${row.id}`} className="bg-white/5">
                        <td colSpan="7" className="px-8 py-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500 border-b border-white/20">
                                <th className="text-left py-2">Nama Obat</th>
                                <th className="text-left py-2">Jumlah</th>
                                <th className="text-left py-2">Harga Satuan</th>
                                <th className="text-left py-2">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.detail.length === 0 ? (
                                <tr><td colSpan="4" className="py-2 text-gray-500">Tidak ada detail.</td></tr>
                              ) : (
                                row.detail.map((d, di) => (
                                  <tr key={di} className="border-b border-white/10">
                                    <td className="py-2">{d.nama_obat}</td>
                                    <td className="py-2">{d.jumlah}</td>
                                    <td className="py-2">{formatRupiah(d.harga_satuan)}</td>
                                    <td className="py-2">{formatRupiah(d.subtotal)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-4 py-2 rounded-2xl bg-white/70 text-gray-800 font-semibold hover:bg-white transition disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-gray-700">Halaman {currentPage} dari {lastPage}</span>
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