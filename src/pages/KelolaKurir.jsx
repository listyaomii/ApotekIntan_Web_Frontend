import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PageShell from "../components/PageShell";
import {
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  User,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { updatePegawai } from "../services/pegawaiService";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const KECAMATAN_TABANAN = [
  "Baturiti", "Kediri", "Kerambitan", "Marga", "Penebel",
  "Pupuan", "Selemadeg", "Selemadeg Barat", "Selemadeg Timur",
  "Tabanan",
];

const STATUS_BADGE = {
  menunggu:     { label: "Menunggu",     color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  dikonfirmasi: { label: "Ditugaskan",   color: "bg-blue-100 text-blue-700 border-blue-300" },
  dikirim:      { label: "Dikirim",      color: "bg-purple-100 text-purple-700 border-purple-300" },
  selesai:      { label: "Selesai",      color: "bg-green-100 text-green-700 border-green-300" },
  ditolak:      { label: "Ditolak",      color: "bg-red-100 text-red-700 border-red-300" },
  dibatalkan:   { label: "Dibatalkan",   color: "bg-gray-100 text-gray-600 border-gray-300" },
};

const formatRupiah = (value) => `Rp ${Number(value).toLocaleString("id-ID")}`;

// Interval auto-refresh (ms) supaya perubahan status oleh kurir ikut terlihat di sini
const AUTO_REFRESH_MS = 10000;

export default function KelolaKurir() {
  const [isOpen, setIsOpen] = useState(true);

  // Data
  const [kurirList, setKurirList]   = useState([]);
  const [pesananList, setPesananList] = useState([]);
  const [loading, setLoading]       = useState(false);

  // Tab: "kurir" | "pesanan"
  const [tab, setTab] = useState("pesanan");

  // Filter
  const [searchKurir, setSearchKurir]     = useState("");
  const [searchPesanan, setSearchPesanan] = useState("");
  const [filterStatus, setFilterStatus]   = useState("semua");

  // Pagination pesanan (server-side, mengikuti Laravel paginate)
  const [pesananPage, setPesananPage]         = useState(1);
  const [pesananLastPage, setPesananLastPage] = useState(1);

  // Detail obat (expand/collapse per pesanan)
  const [expandedPesananId, setExpandedPesananId] = useState(null);

  // Modal form tambah kurir
  const [showFormKurir, setShowFormKurir] = useState(false);
  const [formKurir, setFormKurir]         = useState({ nama: "", email: "", pin: "" });
  const [savingKurir, setSavingKurir]     = useState(false);

  // Modal form edit kurir
  const [editingKurir, setEditingKurir]   = useState(null); // data kurir yang sedang diedit
  const [formEditKurir, setFormEditKurir] = useState({ nama: "", email: "", pin: "" });
  const [savingEditKurir, setSavingEditKurir] = useState(false);

  // Modal tugaskan kurir
  const [modalPesanan, setModalPesanan]   = useState(null); // pesanan yang dipilih
  const [selectedKurir, setSelectedKurir] = useState("");
  const [assigning, setAssigning]         = useState(false);

  // Fetch kurir
  const fetchKurir = async () => {
    try {
      const res = await axios.get(`${API_URL}/pegawai/kurir`);
      setKurirList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal fetch kurir:", err);
    }
  };

  // Fetch pesanan (server-side pagination)
  const fetchPesanan = async (page = 1, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/pesan-antar`, { params: { page } });
      const payload = res.data;
      const data = payload?.data ?? payload ?? [];
      setPesananList(Array.isArray(data) ? data : []);
      setPesananPage(payload?.current_page ?? page);
      setPesananLastPage(payload?.last_page ?? 1);
    } catch (err) {
      console.error("Gagal fetch pesanan:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchKurir();
    fetchPesanan(1);
  }, []);

  // Auto-refresh pesanan secara berkala (silent, tanpa spinner) supaya update status
  // yang dilakukan kurir dari HP (dikirim/selesai) ikut muncul di sini tanpa reload manual.
  useEffect(() => {
    if (tab !== "pesanan") return;

    const interval = setInterval(() => {
      fetchPesanan(pesananPage, { silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [tab, pesananPage]);

  // Tambah kurir
  const handleTambahKurir = async () => {
    if (!formKurir.nama || !formKurir.email || !formKurir.pin) {
      alert("Lengkapi semua data kurir.");
      return;
    }
    setSavingKurir(true);
    try {
      await axios.post(`${API_URL}/pegawai/kurir`, formKurir);
      alert("Kurir berhasil ditambahkan.");
      setFormKurir({ nama: "", email: "", pin: "" });
      setShowFormKurir(false);
      fetchKurir();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal menambahkan kurir.");
    } finally {
      setSavingKurir(false);
    }
  };

  // Buka modal edit, isi form dengan data kurir yang dipilih
  const handleBukaEditKurir = (kurir) => {
    setEditingKurir(kurir);
    setFormEditKurir({ nama: kurir.nama ?? "", email: kurir.email ?? "", pin: "" });
  };

  // Simpan perubahan kurir
  const handleUpdateKurir = async () => {
    if (!formEditKurir.nama || !formEditKurir.email) {
      alert("Nama dan email tidak boleh kosong.");
      return;
    }
    setSavingEditKurir(true);
    try {
      // pin dikirim hanya kalau diisi ulang, supaya tidak menimpa pin lama dengan kosong
      const payload = { nama: formEditKurir.nama, email: formEditKurir.email };
      if (formEditKurir.pin) payload.pin = formEditKurir.pin;

      await updatePegawai(editingKurir.id_pegawai, payload);
      alert("Data kurir berhasil diperbarui.");
      setEditingKurir(null);
      fetchKurir();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal memperbarui data kurir.");
    } finally {
      setSavingEditKurir(false);
    }
  };

  // Hapus kurir
  const handleHapusKurir = async (id) => {
    if (!window.confirm("Hapus kurir ini?")) return;
    try {
      await axios.delete(`${API_URL}/pegawai/${id}`);
      fetchKurir();
    } catch (err) {
      alert("Gagal menghapus kurir.");
    }
  };

  // Tugaskan kurir ke pesanan
  const handleTugaskan = async () => {
    if (!selectedKurir) {
      alert("Pilih kurir terlebih dahulu.");
      return;
    }
    setAssigning(true);
    try {
      const adminId = localStorage.getItem("userId");
      await axios.patch(`${API_URL}/pesan-antar/${modalPesanan.id_pesanan}/status`, {
        status: "dikonfirmasi",
        id_pegawai_kurir: selectedKurir,
        id_pegawai_admin: adminId,
      });
      alert("Kurir berhasil ditugaskan.");
      setModalPesanan(null);
      setSelectedKurir("");
      fetchPesanan(pesananPage);
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal menugaskan kurir.");
    } finally {
      setAssigning(false);
    }
  };

  // Tolak / batalkan pesanan (mis. kurir tidak tersedia)
  const [cancellingId, setCancellingId] = useState(null);

  const handleTolakPesanan = async (pesanan) => {
    const konfirmasi = window.confirm(
      `Tolak pesanan atas nama ${pesanan.nama_pasien}? Status akan diubah menjadi "Dibatalkan".`
    );
    if (!konfirmasi) return;

    setCancellingId(pesanan.id_pesanan);
    try {
      const adminId = localStorage.getItem("userId");
      await axios.patch(`${API_URL}/pesan-antar/${pesanan.id_pesanan}/status`, {
        status: "dibatalkan",
        id_pegawai_admin: adminId,
      });
      alert("Pesanan berhasil ditolak.");
      fetchPesanan(pesananPage);
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal menolak pesanan.");
    } finally {
      setCancellingId(null);
    }
  };

  // Toggle detail obat
  const toggleDetailPesanan = (id) => {
    setExpandedPesananId((prev) => (prev === id ? null : id));
  };

  // Filter pesanan (catatan: hanya menyaring data pada halaman aktif, bukan seluruh data)
  const filteredPesanan = pesananList.filter((p) => {
    const matchSearch =
      p.nama_pasien?.toLowerCase().includes(searchPesanan.toLowerCase()) ||
      p.alamat_pengiriman?.toLowerCase().includes(searchPesanan.toLowerCase());
    const matchStatus = filterStatus === "semua" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredKurir = kurirList.filter((k) =>
    k.nama?.toLowerCase().includes(searchKurir.toLowerCase()) ||
    k.email?.toLowerCase().includes(searchKurir.toLowerCase())
  );

  const jumlahMenunggu = pesananList.filter((p) => p.status === "menunggu").length;

  return (
    <PageShell
      title="Kelola Kurir & Pesanan Antar"
      subtitle="Tugaskan kurir untuk pesanan antar di wilayah Kabupaten Tabanan, Bali."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="kelola-kurir"
      rightSlot={null}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-3xl bg-white/20 backdrop-blur-xl p-5 border border-white/20 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-[#29795a]">
            <CheckCircle size={22} />
            <span className="font-semibold text-sm">Total Kurir</span>
          </div>
          <div className="text-4xl font-bold">{kurirList.length}</div>
        </div>
        <div className="rounded-3xl bg-white/20 backdrop-blur-xl p-5 border border-white/20 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-yellow-600">
            <Truck size={22} />
            <span className="font-semibold text-sm">Pesanan Menunggu</span>
          </div>
          <div className="text-4xl font-bold">{jumlahMenunggu}</div>
        </div>
        <div className="rounded-3xl bg-white/20 backdrop-blur-xl p-5 border border-white/20 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-[#29795a]">
            <MapPin size={22} />
            <span className="font-semibold text-sm">Wilayah Layanan</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">Kabupaten Tabanan, Bali</div>
          <div className="text-xs text-gray-400">{KECAMATAN_TABANAN.length} kecamatan</div>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        {["pesanan", "kurir"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-2xl text-sm font-semibold transition ${
              tab === t
                ? "bg-[#29795a] text-white shadow"
                : "bg-white/30 text-gray-700 hover:bg-white/50"
            }`}
          >
            {t === "pesanan" ? "🛵 Pesanan Antar" : "👤 Data Kurir"}
          </button>
        ))}
      </div>

      {/* TAB: PESANAN */}
      {tab === "pesanan" && (
        <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-sm">
          {/* Filter */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/30 px-4 py-2 flex-1 min-w-[180px]">
              <Search size={16} />
              <input
                value={searchPesanan}
                onChange={(e) => setSearchPesanan(e.target.value)}
                placeholder="Cari nama pasien atau alamat..."
                className="bg-transparent w-full focus:outline-none text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl border border-white/20 bg-white/30 px-4 py-2 text-sm"
            >
              <option value="semua">Semua Status</option>
              {Object.entries(STATUS_BADGE).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Catatan: search & filter hanya berlaku pada data di halaman aktif */}
          {(searchPesanan || filterStatus !== "semua") && (
            <p className="text-xs text-gray-500 mb-4">
              Pencarian dan filter hanya berlaku pada pesanan di halaman {pesananPage} yang sedang ditampilkan.
            </p>
          )}

          {/* List Pesanan */}
          {loading ? (
            <div className="text-center py-10 text-gray-500">Memuat pesanan...</div>
          ) : filteredPesanan.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Tidak ada pesanan ditemukan.</div>
          ) : (
            <div className="space-y-4">
              {filteredPesanan.map((p) => {
                const badge = STATUS_BADGE[p.status] ?? { label: p.status, color: "bg-gray-100 text-gray-600" };
                const kurirTugas = kurirList.find((k) => k.id_pegawai === p.id_pegawai_kurir);
                const detailPesanan = p.detail_pesanan || [];
                const isExpanded = expandedPesananId === p.id_pesanan;

                return (
                  <div key={p.id_pesanan} className="rounded-3xl bg-white/30 border border-white/20 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{p.nama_pasien}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <MapPin size={13} />
                          {p.alamat_pengiriman}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(p.tgl_pesan).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          {" · "}
                          <span className="font-medium text-[#29795a]">{formatRupiah(p.total)}</span>
                        </div>
                        {kurirTugas && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 w-fit">
                            <User size={12} />
                            Kurir: {kurirTugas.nama}
                          </div>
                        )}

                        {/* Tombol Detail Obat */}
                        <button
                          onClick={() => toggleDetailPesanan(p.id_pesanan)}
                          className="mt-3 inline-flex items-center gap-1 rounded-2xl bg-[#8cce90]/20 border border-[#29795a]/20 px-3 py-1.5 text-xs font-semibold text-[#29795a] hover:bg-[#8cce90]/40 transition"
                        >
                          {detailPesanan.length} Item Obat
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

{isExpanded && (
                          <div className="mt-2 space-y-2 min-w-[200px]">
                            {detailPesanan.length === 0 ? (
                              <span className="text-slate-500 text-xs">Tidak ada detail obat.</span>
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
                                      {detail.jumlah} x {formatRupiah(detail.harga_satuan || 0)} ={" "}
                                      <span className="font-semibold">
                                        {formatRupiah(detail.subtotal || 0)}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {/* Breakdown subtotal + ongkir. Ongkir dihitung dari
                                    selisih total pesanan dengan jumlah subtotal item,
                                    karena ongkir tidak disimpan sebagai kolom terpisah
                                    di database — nilainya sudah termasuk di `total`. */}
                                {(() => {
                                  const subtotalPesanan = detailPesanan.reduce(
                                    (sum, d) => sum + Number(d.subtotal || 0),
                                    0
                                  );
                                  const ongkir = Math.max(0, Number(p.total || 0) - subtotalPesanan);

                                  return (
                                    <div className="text-xs rounded-xl border border-white/30 bg-white/40 p-2 space-y-1">
                                      <div className="flex justify-between text-slate-600">
                                        <span>Subtotal Pesanan</span>
                                        <span>{formatRupiah(subtotalPesanan)}</span>
                                      </div>
                                      <div className="flex justify-between text-slate-600">
                                        <span>Ongkos Kirim</span>
                                        <span className={ongkir === 0 ? "font-semibold text-[#29795a]" : ""}>
                                          {ongkir === 0 ? "Gratis" : formatRupiah(ongkir)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-white/40">
                                        <span>Total</span>
                                        <span>{formatRupiah(p.total)}</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tombol tugaskan & tolak — hanya untuk status menunggu */}
                      {p.status === "menunggu" && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setModalPesanan(p); setSelectedKurir(""); }}
                            className="flex items-center gap-2 rounded-2xl bg-[#29795a] px-4 py-2 text-sm text-white font-semibold hover:bg-[#245f48] transition"
                          >
                            <Truck size={15} /> Tugaskan Kurir
                          </button>
                          <button
                            onClick={() => handleTolakPesanan(p)}
                            disabled={cancellingId === p.id_pesanan}
                            className="flex items-center gap-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600 font-semibold hover:bg-red-100 transition disabled:opacity-50"
                          >
                            <XCircle size={15} />
                            {cancellingId === p.id_pesanan ? "Memproses..." : "Tolak Pesanan"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pesananList.length > 0 && pesananLastPage > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => fetchPesanan(pesananPage - 1)}
                disabled={pesananPage <= 1}
                className="rounded-2xl border border-white/20 bg-white/30 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-white/50 transition"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-gray-600">
                Halaman {pesananPage} dari {pesananLastPage}
              </span>
              <button
                onClick={() => fetchPesanan(pesananPage + 1)}
                disabled={pesananPage >= pesananLastPage}
                className="rounded-2xl border border-white/20 bg-white/30 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-white/50 transition"
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: KURIR */}
      {tab === "kurir" && (
        <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/30 px-4 py-2 flex-1 min-w-[180px]">
              <Search size={16} />
              <input
                value={searchKurir}
                onChange={(e) => setSearchKurir(e.target.value)}
                placeholder="Cari nama atau email kurir..."
                className="bg-transparent w-full focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowFormKurir(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#29795a] px-5 py-2 text-sm text-white font-semibold hover:bg-[#245f48] transition"
            >
              <Plus size={16} /> Tambah Kurir
            </button>
          </div>

          {filteredKurir.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Tidak ada kurir ditemukan.</div>
          ) : (
            <div className="space-y-3">
              {filteredKurir.map((k) => (
                <div key={k.id_pegawai} className="rounded-3xl bg-white/30 border border-white/20 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8cce90] to-[#29795a] grid place-items-center text-white font-bold text-sm">
                      {k.nama?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{k.nama}</div>
                      <div className="text-xs text-gray-500">{k.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBukaEditKurir(k)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleHapusKurir(k.id_pegawai)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-3 py-1 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Tugaskan Kurir — di-render via portal ke document.body agar selalu
          tampil center di viewport, terlepas dari backdrop-blur pada PageShell */}
      {modalPesanan && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tugaskan Kurir</h2>
              <button onClick={() => setModalPesanan(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-sm space-y-1">
              <div className="font-medium">{modalPesanan.nama_pasien}</div>
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin size={13} /> {modalPesanan.alamat_pengiriman}
              </div>
              <div className="text-[#29795a] font-semibold">{formatRupiah(modalPesanan.total)}</div>
            </div>

            <label className="block text-sm font-medium mb-2">Pilih Kurir</label>
            {kurirList.length === 0 ? (
              <p className="text-sm text-red-500 mb-4">Belum ada kurir terdaftar.</p>
            ) : (
              <select
                value={selectedKurir}
                onChange={(e) => setSelectedKurir(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm mb-4"
              >
                <option value="">-- Pilih kurir --</option>
                {kurirList.map((k) => (
                  <option key={k.id_pegawai} value={k.id_pegawai}>
                    {k.nama}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalPesanan(null)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleTugaskan}
                disabled={assigning || !selectedKurir}
                className="flex-1 rounded-2xl bg-[#29795a] py-3 text-sm font-semibold text-white hover:bg-[#245f48] transition disabled:opacity-50"
              >
                {assigning ? "Menugaskan..." : "Tugaskan"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tambah Kurir — juga via portal dengan alasan yang sama */}
      {showFormKurir && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Tambah Kurir Baru</h2>
              <button onClick={() => setShowFormKurir(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Nama lengkap"
                value={formKurir.nama}
                onChange={(e) => setFormKurir((p) => ({ ...p, nama: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              />
              <input
                placeholder="Email"
                type="email"
                value={formKurir.email}
                onChange={(e) => setFormKurir((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              />
              <input
                placeholder="PIN (min 4 digit)"
                type="password"
                value={formKurir.pin}
                onChange={(e) => setFormKurir((p) => ({ ...p, pin: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowFormKurir(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleTambahKurir}
                disabled={savingKurir}
                className="flex-1 rounded-2xl bg-[#29795a] py-3 text-sm font-semibold text-white hover:bg-[#245f48] transition disabled:opacity-50"
              >
                {savingKurir ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Edit Kurir — via portal, sama seperti modal lain */}
      {editingKurir && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Edit Data Kurir</h2>
              <button onClick={() => setEditingKurir(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Nama lengkap"
                value={formEditKurir.nama}
                onChange={(e) => setFormEditKurir((p) => ({ ...p, nama: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              />
              <input
                placeholder="Email"
                type="email"
                value={formEditKurir.email}
                onChange={(e) => setFormEditKurir((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              />
              <input
                placeholder="PIN baru (kosongkan jika tidak ingin diubah)"
                type="password"
                value={formEditKurir.pin}
                onChange={(e) => setFormEditKurir((p) => ({ ...p, pin: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditingKurir(null)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateKurir}
                disabled={savingEditKurir}
                className="flex-1 rounded-2xl bg-[#29795a] py-3 text-sm font-semibold text-white hover:bg-[#245f48] transition disabled:opacity-50"
              >
                {savingEditKurir ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PageShell>
  );
}