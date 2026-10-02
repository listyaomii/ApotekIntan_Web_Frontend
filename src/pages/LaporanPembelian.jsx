import React, { useMemo, useState, useEffect } from "react";
import PageShell from "../components/PageShell";
import { Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import * as pembelianService from "../services/pembelianService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatRupiah = (value) => `Rp ${Number(value).toLocaleString("id-ID")}`;

const parsePurchaseDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString);
};

const ITEMS_PER_PAGE = 10;

export default function LaporanPembelian() {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pembelian, setPembelian] = useState([]); // seluruh data (semua halaman digabung)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // halaman tampilan (frontend)

  // Ambil SEMUA halaman dari backend, gabung jadi satu array utuh,
  // supaya search/filter/export akurat untuk semua data.
  const fetchPembelian = async () => {
    setLoading(true);
    setError(null);
    try {
      let page = 1;
      let allData = [];
      let lastPageFromApi = 1;

      do {
        const response = await pembelianService.getLaporanPembelian({ page, per_page: 10 });
        const data = Array.isArray(response) ? response : response?.data ?? [];

        allData = allData.concat(
          data.map((item) => ({
            id: item.id_pembelian ?? item.id,
            tanggal: item.tgl_beli ?? "",
            supplier: item.nama_supplier ?? "-",
            total: Number(item.total ?? 0),
            detail: (item.detail_pembelian ?? []).map((d) => ({
              nama_obat: d.obat?.nama_obat ?? "-",
              jumlah: d.jumlah ?? 0,
              harga_satuan: Number(d.harga_satuan ?? 0),
              subtotal: Number(d.subtotal ?? 0),
            })),
          }))
        );

        lastPageFromApi = response?.last_page ?? 1;
        page += 1;
      } while (page <= lastPageFromApi);

      setPembelian(allData);
      setCurrentPage(1);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Gagal memuat data pembelian.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPembelian();
  }, []);

  const filteredPembelian = useMemo(() => {
    return pembelian.filter((purchase) => {
      const matchesSearch = search
        ? String(purchase.id).includes(search) ||
          purchase.supplier.toLowerCase().includes(search.toLowerCase())
        : true;
      const purchaseDate = parsePurchaseDate(purchase.tanggal);
      const matchesStart = startDate ? purchaseDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? purchaseDate <= new Date(endDate) : true;
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [search, startDate, endDate, pembelian]);

  // Reset ke halaman 1 setiap kali search/filter tanggal berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const lastPage = Math.max(1, Math.ceil(filteredPembelian.length / ITEMS_PER_PAGE));

  const paginatedPembelian = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPembelian.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPembelian, currentPage]);

  const exportCsv = () => {
    const rows = [];
    filteredPembelian.forEach((purchase, index) => {
      purchase.detail.forEach((d, di) => {
        rows.push([
          di === 0 ? index + 1 : "",
          di === 0 ? purchase.tanggal : "",
          di === 0 ? purchase.supplier : "",
          d.nama_obat,
          d.jumlah,
          d.harga_satuan,
          d.subtotal,
          di === 0 ? purchase.total : "",
        ]);
      });
      if (purchase.detail.length === 0) {
        rows.push([index + 1, purchase.tanggal, purchase.supplier, "-", 0, 0, 0, purchase.total]);
      }
    });

    const header = ["No", "Tanggal", "Supplier", "Nama Obat", "Jumlah", "Harga Satuan", "Subtotal", "Total"];
    const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan_pembelian.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Judul
    doc.setFontSize(14);
    doc.text("Laporan Pembelian", 14, 15);

    doc.setFontSize(10);
    doc.text(`Tanggal cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 21);
    doc.text(`Total transaksi: ${filteredPembelian.length}`, 14, 26);
    if (startDate || endDate) {
      doc.text(
        `Periode: ${startDate ? startDate : "awal"} s/d ${endDate ? endDate : "sekarang"}`,
        14,
        31
      );
    }

    // Susun rows seperti CSV: baris pertama tiap transaksi berisi No/Tanggal/Supplier/Total,
    // baris berikutnya (item lain) kosong di kolom itu supaya terlihat mengelompok.
    const rows = [];
    filteredPembelian.forEach((purchase, index) => {
      if (purchase.detail.length === 0) {
        rows.push([
          index + 1,
          purchase.tanggal,
          purchase.supplier,
          "-",
          0,
          formatRupiah(0),
          formatRupiah(0),
          formatRupiah(purchase.total),
        ]);
      } else {
        purchase.detail.forEach((d, di) => {
          rows.push([
            di === 0 ? index + 1 : "",
            di === 0 ? purchase.tanggal : "",
            di === 0 ? purchase.supplier : "",
            d.nama_obat,
            d.jumlah,
            formatRupiah(d.harga_satuan),
            formatRupiah(d.subtotal),
            di === 0 ? formatRupiah(purchase.total) : "",
          ]);
        });
      }
    });

    autoTable(doc, {
      startY: startDate || endDate ? 36 : 31,
      head: [["No", "Tanggal", "Supplier", "Nama Obat", "Jumlah", "Harga Satuan", "Subtotal", "Total"]],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 121, 90], textColor: 255, fontStyle: "bold" },
    });

    doc.save("laporan_pembelian.pdf");
  };

  return (
    <PageShell
      title="Laporan Pembelian"
      subtitle="Lihat laporan pembelian dan ekspor data transaksi untuk analisis cepat."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="laporan-pembelian"
      rightSlot={
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#29795a] px-5 py-3 text-white hover:bg-[#2f8d6b] transition"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={exportPdf}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#c0392b] px-5 py-3 text-white hover:bg-[#e74c3c] transition"
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      }
    >
      {/* Filter */}
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 mb-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Cari</label>
            <input
              type="text"
              placeholder="Cari ID atau supplier"
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
      </div>

      {/* Table */}
      <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full border-collapse text-left text-sm">
            <thead className="border-b border-white/20 bg-white/10 text-gray-600">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">No</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Jumlah Item</th>
                <th className="p-4">Total Pembelian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-4 text-center text-gray-600">Memuat data pembelian...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="p-4 text-center text-red-600">{error}</td></tr>
              ) : paginatedPembelian.length === 0 ? (
                <tr><td colSpan="6" className="p-4 text-center text-gray-600">Tidak ada riwayat pembelian.</td></tr>
              ) : (
                paginatedPembelian.map((purchase, index) => (
                  <React.Fragment key={purchase.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === purchase.id ? null : purchase.id)}
                      className="border-b border-white/10 hover:bg-white/10 transition cursor-pointer"
                    >
                      <td className="p-4 text-center text-gray-500">
                        {expandedId === purchase.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="p-4">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="p-4 whitespace-nowrap">{purchase.tanggal}</td>
                      <td className="p-4">{purchase.supplier}</td>
                      <td className="p-4">{purchase.detail.length} item</td>
                      <td className="p-4 whitespace-nowrap font-semibold">{formatRupiah(purchase.total)}</td>
                    </tr>

                    {expandedId === purchase.id && (
                      <tr className="bg-white/5">
                        <td colSpan="6" className="px-8 py-4">
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
                              {purchase.detail.length === 0 ? (
                                <tr><td colSpan="4" className="py-2 text-gray-500">Tidak ada detail.</td></tr>
                              ) : (
                                purchase.detail.map((d, di) => (
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