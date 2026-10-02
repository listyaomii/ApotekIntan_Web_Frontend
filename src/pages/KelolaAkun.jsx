import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Menu, Plus, Edit, Trash2, Search } from "lucide-react";
import * as pegawaiService from "../services/pegawaiService";
import * as pasienService from "../services/pasienService";

const initialAdmins = [];
const initialPatients = [];

const initialCouriers = [];

export default function KelolaAkun() {
  const [isOpen, setIsOpen] = useState(true);
  const [admins, setAdmins] = useState(initialAdmins);
  const [patients, setPatients] = useState(initialPatients);
  const [couriers, setCouriers] = useState(initialCouriers);
  const [activeTab, setActiveTab] = useState("admin");
  const [filterPatient, setFilterPatient] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [adminForm, setAdminForm] = useState({ nama: "", email: "", pin: "" });
  const [patientForm, setPatientForm] = useState({ nama: "", email: "", telepon: "" });
  const [courierForm, setCourierForm] = useState({ nama: "", email: "", pin: "" });
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editingCourierId, setEditingCourierId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingType, setPendingType] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const currentUserName = typeof window !== "undefined" ? localStorage.getItem("userName") || "Admin Intan" : "Admin Intan";
  const [profileForm, setProfileForm] = useState({ nama: currentUserName, email: "admin@apotek.com", telepon: "081299988776" });
  const [passwordForm, setPasswordForm] = useState({ current: "", newPassword: "", confirm: "" });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const [pegawaiData, pasienData, kurirData] = await Promise.all([
          pegawaiService.getAdminPegawais(),
          pasienService.getPasiens(),
          pegawaiService.getKurirPegawais(),
        ]);

        if (Array.isArray(pegawaiData)) {
          setAdmins(
            pegawaiData.map((p) => ({
              id: p.id ?? p.id_pegawai,
              nama: p.nama ?? p.nama ?? p.name ?? "",
              email: p.email ?? p.email ?? "",
              role: p.role ?? "Admin",
            }))
          );
        }

        if (Array.isArray(pasienData)) {
          setPatients(
            pasienData.map((p) => ({
              id: p.id ?? p.id_pasien ?? p.id,
              nama: p.nama ?? p.nama?? p.name ?? "",
              email: p.email ?? p.email ?? "",
              telepon: p.telepon ?? p.no_telp ?? p.phone ?? "",
              status: p.status ?? "Aktif",
            }))
          );
        }

        if (Array.isArray(kurirData)) {
          setCouriers(
            kurirData.map((p) => ({
              id: p.id ?? p.id_pegawai,
              nama: p.nama ?? p.nama ?? p.name ?? "",
              email: p.email ?? p.email ?? "",
              pin: "",
            }))
          );
        }
      } catch (error) {
        console.error("Error loading accounts:", error);
      }
    };

    fetchAccounts();
  }, []);

  const refreshAccounts = async () => {
    try {
      const [pegawaiData, pasienData, kurirData] = await Promise.all([
        pegawaiService.getAdminPegawais(),
        pasienService.getPasiens(),
        pegawaiService.getKurirPegawais(),
      ]);

      if (Array.isArray(pegawaiData)) {
        setAdmins(
          pegawaiData.map((p) => ({
            id: p.id ?? p.id_pegawai,
            nama: p.nama ?? p.nama ?? p.name ?? "",
            email: p.email ?? p.email ?? "",
            role: p.role ?? "Admin",
          }))
        );
      }

      if (Array.isArray(pasienData)) {
        setPatients(
          pasienData.map((p) => ({
            id: p.id ?? p.id_pasien,
            nama: p.nama ?? p.nama?? p.name ?? "",
            email: p.email ?? p.email ?? "",
            telepon: p.telepon ?? p.no_telp ?? p.phone ?? "",
            status: p.status ?? "Aktif",
          }))
        );
      }

      if (Array.isArray(kurirData)) {
        setCouriers(
          kurirData.map((p) => ({
            id: p.id ?? p.id_pegawai,
            nama: p.nama ?? p.nama_pegawai ?? p.name ?? "",
            email: p.email ?? p.email_pegawai ?? "",
            pin: "",
          }))
        );
      }
    } catch (error) {
      console.error("Error refreshing accounts:", error);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.nama.toLowerCase().includes(filterPatient.toLowerCase()) ||
    patient.email.toLowerCase().includes(filterPatient.toLowerCase()) ||
    patient.telepon.includes(filterPatient)
  );

  const visibleCouriers = couriers.filter((item) =>
    item.nama.toLowerCase().includes(courierFilter.toLowerCase()) ||
    item.email.toLowerCase().includes(courierFilter.toLowerCase())
  );

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientFormChange = (e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourierFormChange = (e) => {
    const { name, value } = e.target;
    setCourierForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetCourierForm = () => {
    setCourierForm({ nama: "", email: "", pin: "" });
    setEditingCourierId(null);
  };

  const saveCourier = () => {
    if (!courierForm.nama || !courierForm.email || !courierForm.pin) {
      alert("Lengkapi data kurir terlebih dahulu.");
      return;
    }

    if (editingCourierId) {
      setCouriers((prev) => prev.map((item) => (item.id === editingCourierId ? { ...item, ...courierForm } : item)));
      alert("Data kurir diperbarui.");
      resetCourierForm();
    } else {
      setPendingData(courierForm);
      setPendingType("kurir");
      setShowConfirmModal(true);
    }
  };

  const confirmSubmitKurir = async () => {
    try {
      await pegawaiService.createKurir({
        nama: pendingData.nama,
        email: pendingData.email,
        pin: pendingData.pin,
      });
      alert("Kurir baru berhasil ditambahkan.");
      resetCourierForm();
      refreshAccounts();
    } catch (error) {
      console.error("Error saving kurir:", error);
      alert("Gagal menyimpan data kurir.");
    } finally {
      setShowConfirmModal(false);
      setPendingData(null);
      setPendingType(null);
    }
  };

  const editCourier = (courier) => {
    setCourierForm({ nama: courier.nama, email: courier.email, pin: "" });
    setEditingCourierId(courier.id);
  };

  const deleteCourier = (id) => {
    if (window.confirm("Hapus kurir ini?")) {
      setCouriers((prev) => prev.filter((item) => item.id !== id));
      if (editingCourierId === id) resetCourierForm();
      alert("Kurir berhasil dihapus.");
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetAdminForm = () => {
    setAdminForm({ nama: "", email: "", pin: "" });
    setEditingAdminId(null);
  };

  const resetPatientForm = () => {
    setPatientForm({ nama: "", email: "", telepon: "" });
    setEditingPatientId(null);
  };

  const saveAdmin = () => {
    if (!adminForm.nama || !adminForm.email || !adminForm.pin) {
      alert("Lengkapi data admin terlebih dahulu.");
      return;
    }
    setPendingData({
      nama: adminForm.nama,
      email: adminForm.email,
      pin: adminForm.pin,
      isEdit: !!editingAdminId,
      editId: editingAdminId ?? null,
    });
    setPendingType("admin");
    setShowConfirmModal(true);
  };

    const confirmSubmitAdmin = async () => {
      try {
        if (pendingData.isEdit) {
          await pegawaiService.updatePegawai(pendingData.editId, {
            nama: pendingData.nama,
            email: pendingData.email,
            role: "admin",
          });
          alert("Data pegawai berhasil diperbarui.");
        } else {
          await pegawaiService.createAdmin({
            nama: pendingData.nama,
            email: pendingData.email,
            pin: pendingData.pin,
          });
          alert("Admin berhasil ditambahkan.");
        }
        resetAdminForm();
        refreshAccounts();
      } catch (error) {
        // Tampilkan pesan error spesifik dari Laravel
        const errors = error.response?.data?.errors;
        if (errors) {
          const messages = Object.values(errors).flat().join("\n");
          alert("Validasi gagal:\n" + messages);
        } else {
          alert("Gagal menyimpan data admin.");
        }
      } finally {
        setShowConfirmModal(false);
        setPendingData(null);
        setPendingType(null);
      }
    };

  const editAdmin = (admin) => {
    setAdminForm({ nama: admin.nama, email: admin.email, pin: "" });
    setEditingAdminId(admin.id);
  };

  const deleteAdmin = async (id) => {
    if (window.confirm("Hapus admin ini?")) {
      try {
        await pegawaiService.deletePegawai(id);
        alert("Pegawai berhasil dihapus.");
        refreshAccounts();
      } catch (error) {
        console.error("Error deleting pegawai:", error);
        alert("Gagal menghapus pegawai.");
      }
    }
  };

  const savePatient = async () => {
    if (!patientForm.nama || !patientForm.email || !patientForm.telepon) {
      alert("Lengkapi data pasien terlebih dahulu.");
      return;
    }

    try {
      if (editingPatientId) {
        await pasienService.updatePasien(editingPatientId, {
          nama: patientForm.nama,
          email: patientForm.email,
          telepon: patientForm.telepon,
        });
        alert("Data pasien berhasil diperbarui.");
      } else {
        await pasienService.createPasien({
          nama: patientForm.nama,
          email: patientForm.email,
          telepon: patientForm.telepon,
        });
        alert("Akun pasien berhasil didaftarkan.");
      }
      resetPatientForm();
      refreshAccounts();
    } catch (error) {
      console.error("Error saving pasien:", error);
      alert("Gagal menyimpan data pasien.");
    }
  };

  const editPatient = (patient) => {
    setPatientForm({ nama: patient.nama, email: patient.email, telepon: patient.telepon });
    setEditingPatientId(patient.id);
  };

  const deletePatient = async (id) => {
    if (window.confirm("Hapus akun pasien ini?")) {
      try {
        await pasienService.deletePasien(id);
        alert("Akun pasien berhasil dihapus.");
        refreshAccounts();
      } catch (error) {
        console.error("Error deleting pasien:", error);
        alert("Gagal menghapus pasien.");
      }
    }
  };

  const saveProfile = () => {
    alert("Profil admin berhasil diperbarui.");
  };

  const changePassword = () => {
    if (!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirm) {
      alert("Lengkapi semua kolom password.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      alert("Password baru dan konfirmasi tidak sama.");
      return;
    }
    alert("Password berhasil diubah.");
    setPasswordForm({ current: "", newPassword: "", confirm: "" });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#8cce90]/40 via-[#5ec9aa]/30 to-[#29795a]/40 backdrop-blur-xl">
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-[#071307] mb-6">Konfirmasi Data</h2>
            <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl">
              <div>
                <p className="text-sm text-gray-600">Nama</p>
                <p className="text-lg font-semibold text-[#071307]">{pendingData?.nama}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-[#071307]">{pendingData?.email}</p>
              </div>
              {!pendingData?.isEdit && (
                <div>
                  <p className="text-sm text-gray-600">PIN</p>
                  <p className="text-lg font-semibold text-[#071307]">••••</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Tipe</p>
                <p className="text-lg font-semibold text-[#071307] capitalize">{pendingType === "admin" ? "Admin" : "Kurir"}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-8">Apakah data yang Anda inputkan sudah benar?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingData(null);
                  setPendingType(null);
                }}
                className="flex-1 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button
                onClick={pendingType === "admin" ? confirmSubmitAdmin : confirmSubmitKurir}
                className="flex-1 py-3 rounded-2xl bg-[#29795a] text-white font-semibold hover:bg-[#1f5a46] transition"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar isOpen={isOpen} active="kelola-akun" />

      <div className="flex-1 p-8 text-[#071307]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition"
            >
              <Menu />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Manajemen Akun</h1>
            <p className="text-sm text-gray-700 mt-1">Kelola admin dan pasien sesuai peran.</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-[32px] p-6 shadow-xl border border-white/10">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] mb-6">
            <div>
              <h1 className="text-3xl font-bold">Manajemen Akun</h1>
              <p className="text-sm text-slate-600 max-w-2xl">Kelola admin, pasien, dan kurir dalam satu halaman. Klik nama atau lingkaran Admin Intan untuk membuka profil dan ubah password.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("profil")}
              className="flex items-center gap-4 rounded-[32px] border border-white/20 bg-white/90 px-5 py-4 shadow-sm transition hover:bg-white"
            >
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[#8cce90] to-[#29795a] text-white grid place-items-center text-lg font-bold">
                AI
              </div>
              <div className="text-left">
                <p className="font-semibold">{currentUserName}</p>
                <p className="text-sm text-slate-500">Klik untuk profil & ubah password</p>
              </div>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { key: "admin", label: "Data Admin" },
              // { key: "pasien", label: "Akun Pasien" },
              // { key: "kurir", label: "Kelola Kurir" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-[#8cce90] text-white"
                    : "bg-white/10 text-[#071307] hover:bg-white/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeTab === "profil" && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                  <h2 className="text-xl font-semibold mb-3">Profil Admin</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nama</label>
                      <input
                        name="nama"
                        value={profileForm.nama}
                        onChange={handleProfileChange}
                        className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Telepon</label>
                      <input
                        name="telepon"
                        value={profileForm.telepon}
                        onChange={handleProfileChange}
                        className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      />
                    </div>
                    <button
                      onClick={saveProfile}
                      className="w-full py-3 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition"
                    >
                      Simpan Profil
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 grid gap-6">
                  <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                    <h2 className="text-xl font-semibold mb-5">Ubah Password Admin</h2>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <input
                        name="current"
                        type="password"
                        placeholder="Password lama"
                        value={passwordForm.current}
                        onChange={handlePasswordChange}
                        className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      />
                      <input
                        name="newPassword"
                        type="password"
                        placeholder="Password baru"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      />
                      <input
                        name="confirm"
                        type="password"
                        placeholder="Konfirmasi password"
                        value={passwordForm.confirm}
                        onChange={handlePasswordChange}
                        className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      />
                    </div>
                    <button
                      onClick={changePassword}
                      className="mt-4 w-full py-3 rounded-2xl bg-[#29795a] text-white font-semibold hover:bg-[#245f48] transition"
                    >
                      Ubah Password
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                    <h2 className="text-xl font-semibold mb-5">Ringkasan Akun</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl bg-white/90 p-5 border border-white/20 shadow-sm">
                        <p className="text-sm text-slate-500">Jumlah Admin</p>
                        <p className="mt-3 text-3xl font-bold">{admins.length}</p>
                      </div>
                      <div className="rounded-3xl bg-white/90 p-5 border border-white/20 shadow-sm">
                        <p className="text-sm text-slate-500">Jumlah Pasien</p>
                        <p className="mt-3 text-3xl font-bold">{patients.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "admin" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-semibold">Data Admin</h2>
                      <p className="text-sm text-slate-600">Tambah, edit, atau hapus admin.</p>
                    </div>
                    <button
                      onClick={resetAdminForm}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition"
                    >
                      <Plus size={16} /> Tambah
                    </button>
                  </div>

                  <div className="space-y-3 mb-5">
                    <input
                      name="nama"
                      value={adminForm.nama}
                      onChange={handleAdminFormChange}
                      placeholder="Nama admin"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <input
                      name="email"
                      value={adminForm.email}
                      onChange={handleAdminFormChange}
                      placeholder="Email admin"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <input
                      type="password"
                      name="pin"
                      value={adminForm.pin}
                      onChange={handleAdminFormChange}
                      placeholder="PIN admin"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <button
                      onClick={saveAdmin}
                      className="w-full py-3 rounded-2xl bg-[#29795a] text-white font-semibold hover:bg-[#245f48] transition"
                    >
                      {editingAdminId ? "Perbarui Admin" : "Simpan Admin"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="rounded-3xl bg-white/90 p-4 border border-white/20 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{admin.nama}</p>
                            <p className="text-sm text-slate-600">{admin.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editAdmin(admin)}
                              className="p-2 rounded-xl bg-[#5ec9aa]/20 text-[#29795a] hover:bg-[#5ec9aa]/40 transition"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteAdmin(admin.id)}
                              className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-700">Role: {admin.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pasien" && (
              <div className="grid gap-6">
                <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
                    {/* <div>
                      <h2 className="text-xl font-semibold">Akun Pasien</h2>
                      <p className="text-sm text-slate-600">Daftar, edit, dan hapus akun pasien.</p>
                    </div> */}
                    <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/30 p-3">
                      <Search />
                      <input
                        value={filterPatient}
                        onChange={(e) => setFilterPatient(e.target.value)}
                        placeholder="Cari pasien..."
                        className="bg-transparent focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <input
                      name="nama"
                      value={patientForm.nama}
                      onChange={handlePatientFormChange}
                      placeholder="Nama pasien"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <input
                      name="email"
                      value={patientForm.email}
                      onChange={handlePatientFormChange}
                      placeholder="Email pasien"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <input
                      name="telepon"
                      value={patientForm.telepon}
                      onChange={handlePatientFormChange}
                      placeholder="Telepon pasien"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <button
                      onClick={savePatient}
                      className="w-full py-3 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition"
                    >
                      {editingPatientId ? "Perbarui Pasien" : "Daftarkan Pasien"}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <div key={patient.id} className="rounded-3xl bg-white/90 p-4 border border-white/20 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{patient.nama}</p>
                            <p className="text-sm text-slate-600">{patient.email}</p>
                            <p className="text-sm text-slate-600">{patient.telepon}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editPatient(patient)}
                              className="p-2 rounded-xl bg-[#5ec9aa]/20 text-[#29795a] hover:bg-[#5ec9aa]/40 transition"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deletePatient(patient.id)}
                              className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-700">Status: {patient.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "kurir" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-semibold">Kelola Kurir</h2>
                      <p className="text-sm text-slate-600">Tambah, edit, dan hapus data kurir sederhana.</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/30 p-3">
                      <Search />
                      <input
                        value={courierFilter}
                        onChange={(e) => setCourierFilter(e.target.value)}
                        placeholder="Cari kurir..."
                        className="bg-transparent focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <input
                      name="nama"
                      value={courierForm.nama}
                      onChange={handleCourierFormChange}
                      placeholder="Nama kurir"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <input
                      name="email"
                      value={courierForm.email}
                      onChange={handleCourierFormChange}
                      placeholder="Email kurir"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <input
                      type="password"
                      name="pin"
                      value={courierForm.pin}
                      onChange={handleCourierFormChange}
                      placeholder="PIN kurir"
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                    />
                    <button
                      onClick={saveCourier}
                      className="w-full py-3 rounded-2xl bg-[#29795a] text-white font-semibold hover:bg-[#245f48] transition"
                    >
                      {editingCourierId ? "Perbarui Kurir" : "Tambah Kurir"}
                    </button>
                    {editingCourierId && (
                      <button
                        onClick={resetCourierForm}
                        className="w-full rounded-2xl border border-gray-300 bg-white py-3 text-gray-700 font-semibold hover:bg-gray-100 transition"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto">
                    {visibleCouriers.map((courier) => (
                      <div key={courier.id} className="rounded-3xl bg-white/90 p-4 border border-white/20 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{courier.nama}</p>
                            <p className="text-sm text-slate-600">{courier.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editCourier(courier)}
                              className="p-2 rounded-xl bg-[#5ec9aa]/20 text-[#29795a] hover:bg-[#5ec9aa]/40 transition"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteCourier(courier.id)}
                              className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-700">Role: Kurir</div>
                      </div>
                    ))}
                    {visibleCouriers.length === 0 && (
                      <div className="rounded-3xl border border-white/20 bg-white/90 p-6 text-center text-gray-600">
                        Tidak ada kurir ditemukan.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
