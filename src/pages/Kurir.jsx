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

export default function Kurir() {
  const [isOpen, setIsOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const navigate = useNavigate();

  const getOrderId = (order) => order.id_pesanan || order.id || order.id_transaksi || order.id_order;
  const getCustomerName = (order) => order.nama_pasien || order.pasien?.nama || order.nama || "Nama belum tersedia";
  const getAddress = (order) => order.alamat_pengiriman || order.alamat || order.pasien?.alamat || "-";
  const getPaymentMethod = (order) => order.metode_pembayaran || order.metode_bayar || order.jenis_pembayaran || order.pembayaran?.metode || "Cash";
  const getDeliveryStatus = (order) => order.status || order.status_pengantaran || order.status_pengiriman || "Menunggu";
  const getPaymentStatus = (order) => order.status_pembayaran || order.status_bayar || order.pembayaran?.status || "";

  const isCashPayment = (order) => getPaymentMethod(order).toLowerCase().includes("cash");
  const canConfirmCash = (order) => isCashPayment(order) && getPaymentStatus(order).toLowerCase().includes("belum");

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
        const status = getDeliveryStatus(order).toLowerCase();
        return status !== "selesai";
      });
      setOrders(filtered);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Gagal memuat pesanan antar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatus = async (order, nextStatus) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      alert("Tidak dapat memperbarui status. ID pesanan tidak ditemukan.");
      return;
    }

    setUpdatingOrderId(orderId);

    try {
      const updated =
        await pesanAntarService.updateStatusPesanAntar(
          orderId,
          nextStatus
        );

      const updatedData = Array.isArray(updated)
        ? updated
        : updated?.data ?? updated;

      setOrders((prev) =>
        prev.map((item) => {
          if (getOrderId(item) !== orderId) {
            return item;
          }

          return {
            ...item,
            status: nextStatus,
            ...updatedData,
          };
        })
      );

      alert("Status pesanan berhasil diperbarui.");
    } catch (err) {
      console.error("Error updating order status:", err);

      const msg =
        err?.response?.data?.message ||
        "Gagal memperbarui status pesanan.";

      alert(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleNextDeliveryStatus = (order) => {
    const current = getDeliveryStatus(order).toLowerCase();

    let nextStatus = "dikirim";

    if (current.includes("menunggu")) {
      nextStatus = "dikirim";
    } else if (current.includes("dalam")) {
      nextStatus = "selesai";
    } else if (current.includes("dikirim")) {
      nextStatus = "selesai";
    } else if (current.includes("selesai")) {
      nextStatus = "selesai";
    }

    updateOrderStatus(order, nextStatus);
  };

  const handleConfirmCash = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      alert(
        "Tidak dapat memperbarui pembayaran. ID pesanan tidak ditemukan."
      );
      return;
    }

    setUpdatingOrderId(orderId);

    try {
      const updated =
        await pesanAntarService.updatePembayaranPesanAntar(
          orderId,
          "sudah_bayar"
        );

      const updatedData = updated?.data ?? updated;

      setOrders((prev) =>
        prev.map((item) => {
          if (getOrderId(item) !== orderId) return item;

          return {
            ...item,
            status_pembayaran: "sudah_bayar",
            ...updatedData,
          };
        })
      );

      alert("Pembayaran cash berhasil dikonfirmasi.");
    } catch (err) {
      console.error("Error updating pembayaran:", err);

      const msg =
        err?.response?.data?.message ||
        "Gagal mengonfirmasi pembayaran.";

      alert(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const toggleDetail = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <PageShell
      title="Pesanan Antar Kurir"
      subtitle="Lihat pesanan antar, ubah status pengiriman, dan konfirmasi pembayaran cash langsung di sini."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="kurir"
      rightSlot={null}
    >
      <div className="bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-lg border border-white/20 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">Daftar Pesanan Antar</h2>
            <p className="text-sm text-slate-600">Lihat pesanan yang harus diantarkan oleh kurir.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/riwayat-kurir")}
              className="flex-1 md:flex-none rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#071307] border border-slate-200 hover:bg-slate-50 transition"
            >
              Lihat Riwayat
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
            <div className="py-8 text-center text-slate-500 text-sm">Memuat pesanan...</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">Tidak ada pesanan antar saat ini.</div>
          ) : (
            orders.map((order, index) => {
              const orderId = getOrderId(order);
              const deliveryStatus = getDeliveryStatus(order);
              const paymentStatus = getPaymentStatus(order);
              const paymentMethod = getPaymentMethod(order);
              const isExpanded = expandedOrderId === orderId;
              const detailPesanan = order.detail_pesanan || [];
              const nextButtonLabel =
                deliveryStatus.toLowerCase().includes("selesai")
                  ? "Selesai"
                  : deliveryStatus.toLowerCase().includes("dikirim")
                  ? "Selesai"
                  : "Mulai Antar";

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
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      deliveryStatus.toLowerCase().includes("selesai")
                        ? "bg-green-100 text-green-800"
                        : deliveryStatus.toLowerCase().includes("dikirim")
                        ? "bg-sky-100 text-sky-800"
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {deliveryStatus}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 break-words mb-2">
                    <span className="font-medium text-slate-700">Alamat: </span>
                    {getAddress(order)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <div className="text-xs text-slate-500">Total</div>
                      <div className="font-semibold">
                        Rp {Number(order.total || order.grand_total || order.total_bayar || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Bayar</div>
                      <div className="font-semibold">{paymentMethod}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Status Pembayaran</div>
                      <span className={`inline-block mt-0.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        paymentStatus.toLowerCase().includes("lunas")
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Detail Obat */}
                  <div className="mb-3">
                    <button
                      onClick={() => toggleDetail(orderId)}
                      className="inline-flex items-center gap-1 rounded-2xl bg-[#8cce90]/20 border border-[#29795a]/20 px-3 py-1.5 text-xs font-semibold text-[#29795a] hover:bg-[#8cce90]/40 transition"
                    >
                      {detailPesanan.length} Item
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

{isExpanded && (
                      <div className="mt-2 space-y-2">
                        {detailPesanan.length === 0 ? (
                          <span className="text-slate-500 text-xs">Tidak ada detail.</span>
                        ) : (
                          <>
                            {detailPesanan.map((detail) => (
                              <div
                                key={detail.id_detail_pesanan}
                                className="text-xs p-2 bg-[#29795a]/10 rounded-xl border border-[#29795a]/20 shadow-sm"
                              >
                                <div className="font-semibold text-slate-800">
                                  {detail.obat?.nama_obat || "Obat tidak diketahui"}
                                </div>
                                <div className="text-slate-600 mt-1">
                                  {detail.jumlah} x Rp {Number(detail.harga_satuan || 0).toLocaleString("id-ID")} ={" "}
                                  <span className="font-semibold">
                                    Rp {Number(detail.subtotal || 0).toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {/* Breakdown subtotal + ongkir, dihitung dari selisih
                                total pesanan dengan jumlah subtotal item (ongkir
                                tidak disimpan terpisah di database). */}
                            {(() => {
                              const totalOrder = Number(order.total || order.grand_total || order.total_bayar || 0);
                              const subtotalPesanan = detailPesanan.reduce(
                                (sum, d) => sum + Number(d.subtotal || 0),
                                0
                              );
                              const ongkir = Math.max(0, totalOrder - subtotalPesanan);

                              return (
                                <div className="text-xs rounded-xl border border-slate-200 bg-white/60 p-2 space-y-1">
                                  <div className="flex justify-between text-slate-600">
                                    <span>Subtotal Pesanan</span>
                                    <span>Rp {subtotalPesanan.toLocaleString("id-ID")}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-600">
                                    <span>Ongkos Kirim</span>
                                    <span className={ongkir === 0 ? "font-semibold text-[#29795a]" : ""}>
                                      {ongkir === 0 ? "Gratis" : `Rp ${ongkir.toLocaleString("id-ID")}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                                    <span>Total</span>
                                    <span>Rp {totalOrder.toLocaleString("id-ID")}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Aksi */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleNextDeliveryStatus(order)}
                      disabled={updatingOrderId === orderId || deliveryStatus.toLowerCase().includes("selesai")}
                      className="w-full rounded-2xl bg-[#29795a] px-3 py-2 text-xs font-semibold text-black hover:bg-[#7dbb95] disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                    >
                      {updatingOrderId === orderId ? "Menyimpan..." : nextButtonLabel}
                    </button>
                    {canConfirmCash(order) && (
                      <button
                        onClick={() => handleConfirmCash(order)}
                        disabled={updatingOrderId === orderId}
                        className="w-full rounded-2xl bg-[#8cce90] px-3 py-2 text-xs font-semibold text-black hover:bg-[#b8e8c6] disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                      >
                        {updatingOrderId === orderId ? "Menyimpan..." : "Konfirmasi Cash"}
                      </button>
                    )}
                  </div>
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
                <th className="px-4 py-3">Bayar</th>
                <th className="px-4 py-3">Status Pengantaran</th>
                <th className="px-4 py-3">Status Pembayaran</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                    Memuat pesanan...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                    Tidak ada pesanan antar saat ini.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const orderId = getOrderId(order);
                  const deliveryStatus = getDeliveryStatus(order);
                  const paymentStatus = getPaymentStatus(order);
                  const paymentMethod = getPaymentMethod(order);
                  const isExpanded = expandedOrderId === orderId;
                  const detailPesanan = order.detail_pesanan || [];
                  const nextButtonLabel =
                    deliveryStatus.toLowerCase().includes("selesai")
                      ? "Selesai"
                      : deliveryStatus.toLowerCase().includes("dikirim")
                      ? "Selesai"
                      : "Mulai Antar";

                  return (
                    <tr key={orderId || index} className="border-b border-slate-200 hover:bg-[#29795a]/10 transition-all">
                      <td className="px-4 py-4 align-top">{index + 1}</td>
                      <td className="px-4 py-4 align-top font-medium">{orderId || "-"}</td>
                      <td className="px-4 py-4 align-top">{getCustomerName(order)}</td>
                      <td className="px-4 py-4 align-top max-w-xs break-words">{getAddress(order)}</td>

                      {/* Detail Obat */}
                      <td className="px-4 py-4 align-top">
                        <button
                          onClick={() => toggleDetail(orderId)}
                          className="inline-flex items-center gap-1 rounded-2xl bg-[#8cce90]/20 border border-[#29795a]/20 px-3 py-1.5 text-xs font-semibold text-[#29795a] hover:bg-[#8cce90]/40 transition"
                        >
                          {detailPesanan.length} Item
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

{isExpanded && (
                          <div className="mt-2 space-y-2 min-w-[200px]">
                            {detailPesanan.length === 0 ? (
                              <span className="text-slate-500 text-xs">Tidak ada detail.</span>
                            ) : (
                              <>
                                {detailPesanan.map((detail) => (
                                  <div
                                    key={detail.id_detail_pesanan}
                                    className="text-xs p-2 bg-[#29795a]/10 rounded-xl border border-[#29795a]/20 shadow-sm"
                                  >
                                    <div className="font-semibold text-slate-800">
                                      {detail.obat?.nama_obat || "Obat tidak diketahui"}
                                    </div>
                                    <div className="text-slate-600 mt-1">
                                      {detail.jumlah} x Rp {Number(detail.harga_satuan || 0).toLocaleString("id-ID")} ={" "}
                                      <span className="font-semibold">
                                        Rp {Number(detail.subtotal || 0).toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {/* Breakdown subtotal + ongkir, dihitung dari selisih
                                    total pesanan dengan jumlah subtotal item (ongkir
                                    tidak disimpan terpisah di database). */}
                                {(() => {
                                  const totalOrder = Number(order.total || order.grand_total || order.total_bayar || 0);
                                  const subtotalPesanan = detailPesanan.reduce(
                                    (sum, d) => sum + Number(d.subtotal || 0),
                                    0
                                  );
                                  const ongkir = Math.max(0, totalOrder - subtotalPesanan);

                                  return (
                                    <div className="text-xs rounded-xl border border-slate-200 bg-white/60 p-2 space-y-1">
                                      <div className="flex justify-between text-slate-600">
                                        <span>Subtotal Pesanan</span>
                                        <span>Rp {subtotalPesanan.toLocaleString("id-ID")}</span>
                                      </div>
                                      <div className="flex justify-between text-slate-600">
                                        <span>Ongkos Kirim</span>
                                        <span className={ongkir === 0 ? "font-semibold text-[#29795a]" : ""}>
                                          {ongkir === 0 ? "Gratis" : `Rp ${ongkir.toLocaleString("id-ID")}`}
                                        </span>
                                      </div>
                                      <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                                        <span>Total</span>
                                        <span>Rp {totalOrder.toLocaleString("id-ID")}</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        Rp {Number(order.total || order.grand_total || order.total_bayar || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-4 align-top">{paymentMethod}</td>
                      <td className="px-4 py-4 align-top">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          deliveryStatus.toLowerCase().includes("selesai")
                          ? "bg-green-100 text-green-800"
                          : deliveryStatus.toLowerCase().includes("dikirim")
                          ? "bg-sky-100 text-sky-800"
                          : "bg-orange-100 text-orange-800"
                        }`}>
                          {deliveryStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          paymentStatus.toLowerCase().includes("lunas")
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top space-y-2">
                        <button
                          onClick={() => handleNextDeliveryStatus(order)}
                          disabled={updatingOrderId === orderId || deliveryStatus.toLowerCase().includes("selesai")}
                          className="w-full rounded-2xl bg-[#29795a] px-3 py-2 text-xs font-semibold text-black hover:bg-[#7dbb95] disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                        >
                          {updatingOrderId === orderId ? "Menyimpan..." : nextButtonLabel}
                        </button>
                        {canConfirmCash(order) && (
                          <button
                            onClick={() => handleConfirmCash(order)}
                            disabled={updatingOrderId === orderId}
                            className="w-full rounded-2xl bg-[#8cce90] px-3 py-2 text-xs font-semibold text-black hover:bg-[#b8e8c6] disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                          >
                            {updatingOrderId === orderId ? "Menyimpan..." : "Konfirmasi Cash"}
                          </button>
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