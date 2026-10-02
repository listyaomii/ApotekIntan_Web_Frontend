import { useState, useEffect } from "react";
import PageShell from "../components/PageShell";
import { TrendingUp, TrendingDown } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

function MutasiCard({ item, tipe }) {
  return (
    <div className="rounded-3xl bg-white/90 p-4 border border-white/20 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3 flex-1">
          {tipe === "Masuk"
            ? <TrendingUp className="text-green-600 shrink-0" size={18} />
            : <TrendingDown className="text-red-600 shrink-0" size={18} />
          }
          <div className="flex-1">
            <p className="font-semibold text-sm">{item.produk}</p>
            <p className="text-xs text-gray-600">{item.tanggal}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${
          tipe === "Masuk" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {tipe === "Masuk" ? "Masuk" : "Keluar"}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-2">
        {tipe === "Masuk" ? `Dari: ${item.pihak}` : `Ke: ${item.pihak}`}
      </p>
      <div className="bg-white/40 p-2 rounded-2xl text-sm">
        <span className="text-gray-600">Qty: </span>
        <span className="font-semibold">{item.jumlah}</span>
      </div>
    </div>
  );
}

function PaginationBar({ currentPage, lastPage, onPageChange, loading }) {
  if (lastPage <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || loading}
        className="px-4 py-2 rounded-2xl bg-white/70 text-gray-800 font-semibold hover:bg-white transition disabled:opacity-50"
      >
        Sebelumnya
      </button>
      <span className="text-sm text-gray-700">
        Halaman {currentPage} dari {lastPage}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage || loading}
        className="px-4 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition disabled:opacity-50"
      >
        Berikutnya
      </button>
    </div>
  );
}

export default function MutasiStok() {
  const [isOpen, setIsOpen] = useState(true);

  const [mutasiMasuk, setMutasiMasuk] = useState([]);
  const [pageMasuk, setPageMasuk] = useState(1);
  const [lastPageMasuk, setLastPageMasuk] = useState(1);
  const [loadingMasuk, setLoadingMasuk] = useState(false);

  const [mutasiKeluar, setMutasiKeluar] = useState([]);
  const [pageKeluar, setPageKeluar] = useState(1);
  const [lastPageKeluar, setLastPageKeluar] = useState(1);
  const [loadingKeluar, setLoadingKeluar] = useState(false);

  const fetchMasuk = async (page = 1) => {
    setLoadingMasuk(true);
    try {
      const res = await axios.get(`${API_URL}/mutasi-stok/masuk`, {
        params: { page },
        withCredentials: true,
      });
      const data = res.data?.data ?? [];
      setMutasiMasuk(Array.isArray(data) ? data : []);
      setPageMasuk(res.data?.current_page ?? page);
      setLastPageMasuk(res.data?.last_page ?? 1);
    } catch (err) {
      console.error("Error fetching mutasi masuk:", err);
    } finally {
      setLoadingMasuk(false);
    }
  };

  const fetchKeluar = async (page = 1) => {
    setLoadingKeluar(true);
    try {
      const res = await axios.get(`${API_URL}/mutasi-stok/keluar`, {
        params: { page },
        withCredentials: true,
      });
      const data = res.data?.data ?? [];
      setMutasiKeluar(Array.isArray(data) ? data : []);
      setPageKeluar(res.data?.current_page ?? page);
      setLastPageKeluar(res.data?.last_page ?? 1);
    } catch (err) {
      console.error("Error fetching mutasi keluar:", err);
    } finally {
      setLoadingKeluar(false);
    }
  };

  useEffect(() => {
    fetchMasuk(1);
    fetchKeluar(1);
  }, []);

  return (
    <PageShell
      title="Mutasi Stok"
      subtitle="Pantau pergerakan stok produk secara real-time."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="mutasi-stok"
      rightSlot={null}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* MUTASI MASUK */}
        <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Mutasi Masuk</h2>
          <div className="space-y-3">
            {loadingMasuk ? (
              <p className="text-sm text-gray-500">Memuat data masuk...</p>
            ) : mutasiMasuk.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada data mutasi masuk.</p>
            ) : (
              mutasiMasuk.map((item) => (
                <MutasiCard key={`masuk-${item.id}`} item={item} tipe="Masuk" />
              ))
            )}
          </div>
          <PaginationBar
            currentPage={pageMasuk}
            lastPage={lastPageMasuk}
            onPageChange={(p) => fetchMasuk(p)}
            loading={loadingMasuk}
          />
        </div>

        {/* MUTASI KELUAR */}
        <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Mutasi Keluar</h2>
          <div className="space-y-3">
            {loadingKeluar ? (
              <p className="text-sm text-gray-500">Memuat data keluar...</p>
            ) : mutasiKeluar.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada data mutasi keluar.</p>
            ) : (
              mutasiKeluar.map((item) => (
                <MutasiCard key={`keluar-${item.id}`} item={item} tipe="Keluar" />
              ))
            )}
          </div>
          <PaginationBar
            currentPage={pageKeluar}
            lastPage={lastPageKeluar}
            onPageChange={(p) => fetchKeluar(p)}
            loading={loadingKeluar}
          />
        </div>

      </div>
    </PageShell>
  );
}