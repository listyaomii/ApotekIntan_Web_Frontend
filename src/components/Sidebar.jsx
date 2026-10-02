import { LayoutDashboard, Package, ShoppingCart, Truck, ShoppingBag, BarChart3, Users, Tag, AlertTriangle, FileText, UserPlus, MapPin, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Sidebar({ isOpen, active  }) {
  const navigate = useNavigate();
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userName = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
  const isOwner = userRole === "owner";
  const isCourier = userRole === "kurir";
  const displayRole = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Admin";

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/");
  };

  return (
    <div
      className={`${isOpen ? "w-72" : "w-20"} 
      sticky top-0 h-screen self-start bg-white/15 backdrop-blur-xl border-r border-white/10 
      p-5 ${isOpen ? "pl-6" : "pl-3"} rounded-r-3xl transition-all duration-300 flex-shrink-0`}
    >
      <div className="flex flex-col h-full">
        <div className="mb-8">
          <Link
            to="/kelola-akun"
            className={`flex items-center gap-3 ${isOpen ? "justify-start" : "justify-center"} rounded-3xl p-3 hover:bg-white/20 transition`}
          >
            <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-[#8cce90] to-[#29795a] text-white grid place-items-center text-lg font-bold">
              AI
            </div>
            {isOpen && (
              <div className="space-y-1">
                <p className="font-semibold">{userName || "Admin Intan"}</p>
                <p className="text-xs text-slate-500">{displayRole}</p>
              </div>
            )}
          </Link>
          {isOpen && <p className="mt-4 text-xs text-slate-500">Kelola data dan menu dengan cepat.</p>}
        </div>

        <div className="flex-1">
          {isOpen && <p className="mb-3 text-[11px] uppercase tracking-[.18em] text-slate-400">Navigasi</p>}
          <ul className="space-y-2 text-[#071307]">
            {isOwner ? (
              <>
                  <li>
                    <Link
                      to="/grafik-penjualan"
                      className={`px-3 py-2 rounded-xl flex items-center ${
                        isOpen ? "gap-3" : "justify-center"
                      } ${
                        active === "grafik-penjualan"
                          ? "bg-[#8cce90] text-white"
                          : "hover:bg-white/30"
                      }`}
                    >
                      <LayoutDashboard />
                      {isOpen && <span className="text-sm">Grafik Penjualan</span>}
                    </Link>
                </li>
                <li>
                    <Link
                      to="/obat-terlaris"
                      className={`px-3 py-2 rounded-xl flex items-center ${
                        isOpen ? "gap-3" : "justify-center"
                      } ${
                        active === "obat-terlaris"
                          ? "bg-[#8cce90] text-white"
                          : "hover:bg-white/30"
                      }`}
                    >
                      <BarChart3 />
                      {isOpen && <span className="text-sm">Obat Terlaris</span>}
                    </Link>
                </li>
                {/* <li>
                  <Link to="/obat-terlaris" className={`... ${active === "obat-terlaris" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}>
                    <BarChart3 />
                    {isOpen && <span className="text-sm">Obat Terlaris</span>}
                  </Link>
                </li> */}
                <li>
                  <Link
                    to="/laporan-penjualan"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "laporan-penjualan" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <FileText />
                    {isOpen && <span className="text-sm">Laporan Penjualan</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/laporan-pembelian"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "laporan-pembelian" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <FileText />
                    {isOpen && <span className="text-sm">Laporan Pembelian</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/laporan-stok"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "laporan-stok" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <FileText />
                    {isOpen && <span className="text-sm">Laporan Stok Obat</span>}
                  </Link>
                </li>
              </>
            ) : isCourier ? (
              <>
                <li>
                  <Link
                    to="/kurir"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "kurir" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <Truck />
                    {isOpen && <span className="text-sm">Pesanan Antar</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/riwayat-kurir"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "kurir-riwayat" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <FileText />
                    {isOpen && <span className="text-sm">Riwayat Antar</span>}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "dashboard" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <LayoutDashboard />
                    {isOpen && <span className="text-sm font-medium">Dashboard</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/Produk"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "produk" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <Package />
                    {isOpen && <span className="text-sm">Obat</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/transaksi-pembelian"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "transaksi-pembelian" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <Truck />
                    {isOpen && <span className="text-sm">Transaksi Pembelian</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/transaksi-penjualan"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "transaksi-penjualan" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <ShoppingBag />
                    {isOpen && <span className="text-sm">Transaksi Penjualan</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/kelola-kurir"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "kelola-kurir" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <BarChart3 />
                    {isOpen && <span className="text-sm">Pesan Antar</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/stok-kadaluarsa"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "stok-kadaluarsa" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <AlertTriangle />
                    {isOpen && <span className="text-sm">Stok Kadaluarsa & Minimum</span>}
                  </Link>
                </li>

                {isOpen && <p className="mt-6 mb-3 text-[11px] uppercase tracking-[.18em] text-slate-400">Kelola</p>}

                <li>
                  <Link
                    to="/kelola-supplier"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "kelola-supplier" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <Users />
                    {isOpen && <span className="text-sm">Kelola Supplier</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/kelola-kategori-satuan"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "kelola-kategori-satuan" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <Tag />
                    {isOpen && <span className="text-sm">Kelola Kategori & Satuan</span>}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/kelola-akun"
                    className={`px-3 py-2 rounded-xl flex items-center ${
                      isOpen ? "gap-3" : "justify-center"
                    } ${active === "kelola-akun" ? "bg-[#8cce90] text-white" : "hover:bg-white/30"}`}
                  >
                    <UserPlus />
                    {isOpen && <span className="text-sm">Kelola Akun</span>}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className={`w-full px-3 py-3 rounded-xl flex items-center justify-center gap-3 bg-red-500/20 hover:bg-red-500/30 text-red-600 transition mt-4 border border-red-500/30`}
        >
          <LogOut size={20} />
          {isOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}