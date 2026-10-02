import { useState, useEffect } from "react";
import PageShell from "../components/PageShell";
import { Plus, Edit, Trash2, Phone, User } from "lucide-react";
import * as supplierService from "../services/supplierService";

export default function KelolaSupplier() {
  const [isOpen, setIsOpen] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nama_supplier: "",
    nama_sales: "",
    no_telp: "",
    email: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers();
      const normalized = Array.isArray(data)
        ? data.map((item) => ({
            id: item.id ?? item.id_supplier,
            nama_supplier: item.nama_supplier ?? item.nama ?? "",
            nama_sales: item.nama_sales ?? "",
            no_telp: item.no_telp ?? item.telepon ?? "",
            email: item.email ?? "",
          }))
        : [];
      setSuppliers(normalized);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async () => {
    if (!formData.nama_supplier || !formData.no_telp) {
      alert("Lengkapi data supplier terlebih dahulu.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const updatedSupplier = await supplierService.updateSupplier(editingId, formData);
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  id: updatedSupplier.id ?? updatedSupplier.id_supplier,
                  nama_supplier: updatedSupplier.nama_supplier,
                  nama_sales: updatedSupplier.nama_sales,
                  no_telp: updatedSupplier.no_telp,
                  email: updatedSupplier.email,
                }
              : s
          )
        );
        alert("Data supplier berhasil diperbarui.");
        setEditingId(null);
      } else {
        const newSupplier = await supplierService.createSupplier(formData);
        setSuppliers((prev) => [
          ...prev,
          {
            id: newSupplier.id ?? newSupplier.id_supplier,
            nama_supplier: newSupplier.nama_supplier,
            nama_sales: newSupplier.nama_sales,
            no_telp: newSupplier.no_telp,
            email: newSupplier.email,
          },
        ]);
        alert("Supplier baru berhasil ditambahkan.");
      }

      setFormData({ nama_supplier: "", nama_sales: "", no_telp: "", email: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Gagal menyimpan data supplier.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSupplier = (supplier) => {
    setFormData({
      nama_supplier: supplier.nama_supplier,
      nama_sales: supplier.nama_sales,
      no_telp: supplier.no_telp,
      email: supplier.email,
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus supplier ini?")) {
      return;
    }

    try {
      await supplierService.deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      alert("Supplier berhasil dihapus.");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Gagal menghapus supplier.");
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const search = String(searchTerm || "").toLowerCase();
    const nama = String(s?.nama_supplier || "").toLowerCase();
    const namaSales = String(s?.nama_sales || "").toLowerCase();
    return nama.includes(search) || namaSales.includes(search);
  });

  return (
    <PageShell
      title="Kelola Supplier"
      subtitle="Tambah, edit, atau hapus data supplier apotek Anda."
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      active="kelola-supplier"
      rightSlot={
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ nama_supplier: "", nama_sales: "", no_telp: "", email: "" });
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition"
        >
          <Plus size={20} /> Tambah Supplier
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Supplier" : "Tambah Supplier Baru"}</h2>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Supplier</label>
                    <input
                      type="text"
                      name="nama_supplier"
                      value={formData.nama_supplier}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      placeholder="CV Intan Farma"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Sales</label>
                    <input
                      type="text"
                      name="nama_sales"
                      value={formData.nama_sales}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      placeholder="Budi Santoso"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telepon</label>
                    <input
                      type="tel"
                      name="no_telp"
                      value={formData.no_telp}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      placeholder="08123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
                      placeholder="budi@intanfarma.com"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddSupplier}
                    className="flex-1 py-3 rounded-2xl bg-[#8cce90] text-white font-semibold hover:bg-[#5ec9aa] transition"
                  >
                    {editingId ? "Perbarui" : "Tambah"}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ nama_supplier: "", nama_sales: "", no_telp: "", email: "" });
                    }}
                    className="flex-1 py-3 rounded-2xl bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 mb-6">
              <input
                type="text"
                placeholder="Cari supplier berdasarkan nama atau nama sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/30 border border-white/20"
              />
            </div>

            <div className="space-y-4">
              {filteredSuppliers.length === 0 ? (
                <div className="bg-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 text-center">
                  <p className="text-gray-700">Tidak ada supplier ditemukan.</p>
                </div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="bg-white/90 rounded-3xl p-6 border border-white/20 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{supplier.nama_supplier}</h3>
                        {supplier.nama_sales && (
                          <p className="text-sm text-gray-600 mb-3">Sales: {supplier.nama_sales}</p>
                        )}
                        <div className="flex flex-col gap-2 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-[#8cce90]" />
                            <span>{supplier.no_telp}</span>
                          </div>
                          {supplier.email && (
                            <div>
                              <span className="text-gray-600">Email: </span>
                              <span>{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-3 rounded-2xl bg-[#5ec9aa]/20 text-[#29795a] hover:bg-[#5ec9aa]/40 transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="p-3 rounded-2xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
    </PageShell>
  );
}