import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as pesanAntarService from "../services/pesanAntarService";

// Ambil ID pegawai (kurir) yang sedang login dari localStorage.
// Login.jsx menyimpannya sebagai string biasa di key "userId"
// (bukan JSON object), lewat localStorage.setItem("userId", ...).
const getLoggedInKurirId = () => {
  const id = localStorage.getItem("userId");
  return id && id !== "" ? id : null;
};

export default function RiwayatKurir() {
  const [isOpen, setIsOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const getOrderId = (order) => order.id_pesanan || order.id || order.id_transaksi || order.id_order;
  const getCustomerName = (order) => order.nama_pasien || order.pasien?.nama || order.nama || "Nama belum tersedia";
  const getAddress = (order) => order.alamat_pengiriman || order.alamat || order.pasien?.alamat || "-";
  const getPaymentMethod = (order) => order.metode_pembayaran || order.metode_bayar || order.jenis_pembayaran || order.pembayaran?.metode || "Cash";
  const getPaymentStatus = (order) => order.status_pembayaran || order.status_bayar || order.pembayaran?.status || "";

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    const idPegawaiKurir = getLoggedInKurirId();

    if (!idPegawaiKurir) {
      setError("ID kurir tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    try {
      const response = await pesanAntarService.getPesanAntar({
        id_pegawai_kurir: idPegawaiKurir,
      });
      const data = Array.isArray(response) ? response : response.data ?? response;
      const filtered = (Array.isArray(data) ? data : []).filter((order) => {
        return order.status?.toLowerCase() === "selesai";
      });
      setOrders(filtered);
    } catch (err) {
      console.error("Error loading completed orders:", err);
      setError("Gagal memuat riwayat pesanan antar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <PageShell
      title="Riwayat Pesanan Antar"
      subtitle="Lihat semua pengantaran yang sudah selesai dikirim oleh kurir."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="kurir-riwayat"
      rightSlot={null}
    >
      <div className="bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-lg border border-white/20 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">Riwayat Pesanan Antar Selesai</h2>
            <p className="text-sm text-slate-600">Daftar pengantaran yang sudah ditutup dan selesai oleh kurir.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/kurir")}
              className="flex-1 md:flex-none rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#071307] border border-slate-200 hover:bg-slate-50 transition"
            >
              Kembali ke Pesanan Antar
            </button>
            <button
              onClick={loadOrders}
              className="flex-1 md:flex-none rounded-2xl bg-[#8cce90] px-4 py-2 text-sm font-semibold text-black hover:bg-[#b8e8c6] transition"
            >
              {loading ? "Memuat..." : "Muat Ulang"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-100 border border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ===== TAMPILAN MOBILE (card) - hanya muncul di bawah md ===== */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Memuat riwayat...</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">Tidak ada riwayat pengantaran selesai.</div>
          ) : (
            orders.map((order, index) => {
              const orderId = getOrderId(order);
              const detailPesanan = order.detail_pesanan || [];
              const isExpanded = expandedId === orderId;

              return (
                <div
                  key={orderId || index}
                  className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-xs text-slate-500">#{index + 1} • ID {orderId || "-"}</div>
                      <div className="font-semibold text-slate-800">{getCustomerName(order)}</div>
                    </div>
                    <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800">
                      Selesai
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 break-words mb-2">
                    <span className="font-medium text-slate-700">Alamat: </span>
                    {getAddress(order)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <div className="text-xs text-slate-500">Total</div>
                      <div className="font-semibold">Rp {Number(order.total || 0).toLocaleString("id-ID")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Pembayaran</div>
                      <div className="font-semibold">{getPaymentMethod(order)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Status Pembayaran</div>
                      <div className="font-semibold">{getPaymentStatus(order)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Tanggal</div>
                      <div className="font-semibold">
                        {order.tgl_pesan || order.tgl_jual || order.tanggal || order.created_at || "-"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : orderId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8cce90]/20 text-[#29795a] text-xs font-semibold hover:bg-[#8cce90]/40 transition"
                  >
                    {detailPesanan.length} item
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3">
                      {detailPesanan.length === 0 ? (
                        <span className="text-slate-500 text-sm">Tidak ada detail obat.</span>
                      ) : (
                        <div className="space-y-2">
                          {detailPesanan.map((detail) => (
                            <div
                              key={detail.id_detail_pesanan}
                              className="text-xs p-3 bg-[#29795a]/10 rounded-xl border border-[#29795a]/20 flex flex-col gap-1"
                            >
                              <span className="font-semibold text-[#1a4d3a]">
                                {detail.obat?.nama_obat || "Obat tidak diketahui"}
                              </span>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">
                                  {detail.jumlah} x Rp {Number(detail.harga_satuan || 0).toLocaleString("id-ID")}
                                </span>
                                <span className="font-semibold text-[#29795a]">
                                  Rp {Number(detail.subtotal || 0).toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ===== TAMPILAN DESKTOP (tabel) - hanya muncul di md ke atas ===== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">ID Pesanan</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Alamat</th>
                <th className="px-4 py-3">Detail Obat</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pembayaran</th>
                <th className="px-4 py-3">Status Pembayaran</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                    Memuat riwayat...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                    Tidak ada riwayat pengantaran selesai.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const orderId = getOrderId(order);
                  const detailPesanan = order.detail_pesanan || [];
                  const isExpanded = expandedId === orderId;

                  return (
                    <>
                      <tr key={orderId || index} className="border-b border-slate-200 hover:bg-[#29795a]/10 transition-all">
                        <td className="px-4 py-4 align-top">{index + 1}</td>
                        <td className="px-4 py-4 align-top font-medium">{orderId || "-"}</td>
                        <td className="px-4 py-4 align-top">{getCustomerName(order)}</td>
                        <td className="px-4 py-4 align-top max-w-xs break-words">{getAddress(order)}</td>
                        <td className="px-4 py-4 align-top">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : orderId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8cce90]/20 text-[#29795a] text-xs font-semibold hover:bg-[#8cce90]/40 transition"
                          >
                            {detailPesanan.length} item
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        <td className="px-4 py-4 align-top">Rp {Number(order.total || 0).toLocaleString("id-ID")}</td>
                        <td className="px-4 py-4 align-top">{getPaymentMethod(order)}</td>
                        <td className="px-4 py-4 align-top">{getPaymentStatus(order)}</td>
                        <td className="px-4 py-4 align-top">{order.tgl_pesan || order.tgl_jual || order.tanggal || order.created_at || "-"}</td>
                      </tr>

                      {isExpanded && (
                        <tr key={`detail-${orderId}`} className="bg-transparent">
                          <td colSpan="9" className="px-8 py-4">
                            {detailPesanan.length === 0 ? (
                              <span className="text-slate-500 text-sm">Tidak ada detail obat.</span>
                            ) : (
                              <div className="space-y-2">
                                {detailPesanan.map((detail) => (
                                  <div
                                    key={detail.id_detail_pesanan}
                                    className="text-xs p-3 bg-[#29795a]/10 rounded-xl border border-[#29795a]/20 flex items-center justify-between gap-4"
                                  >
                                    <span className="font-semibold text-[#1a4d3a]">
                                      {detail.obat?.nama_obat || "Obat tidak diketahui"}
                                    </span>
                                    <span className="text-slate-600">
                                      {detail.jumlah} x Rp {Number(detail.harga_satuan || 0).toLocaleString("id-ID")}
                                    </span>
                                    <span className="font-semibold text-[#29795a]">
                                      Rp {Number(detail.subtotal || 0).toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
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