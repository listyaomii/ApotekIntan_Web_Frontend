import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Produk from "./pages/Produk";
import TransaksiPembelian from "./pages/TransaksiPembelian";
import TransaksiPenjualan from "./pages/TransaksiPenjualan";
import MutasiStok from "./pages/MutasiStok";
import StokKadaluarsa from "./pages/StokKadaluarsa";
import LaporanPembelian from "./pages/LaporanPembelian";
import LaporanPenjualan from "./pages/LaporanPenjualan";
import LaporanStok from "./pages/LaporanStok";
import KelolaSupplier from "./pages/KelolaSupplier";
import KelolaKategoriSatuan from "./pages/KelolaKategoriSatuan";
import KelolaAkun from "./pages/KelolaAkun";
import KelolaKurir from "./pages/KelolaKurir";
import Kurir from "./pages/Kurir";
import RiwayatKurir from "./pages/RiwayatKurir";
import GrafikPenjualan from "./pages/GrafikPenjualan";
import ObatTerlaris from "./pages/ObatTerlaris";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Produk" element={<Produk />} />
        <Route path="/transaksi-pembelian" element={<TransaksiPembelian />} />
        <Route path="/transaksi-penjualan" element={<TransaksiPenjualan />} />
        <Route path="/mutasi-stok" element={<MutasiStok />} />
        <Route path="/laporan-penjualan" element={<LaporanPenjualan />} />
        <Route path="/laporan-pembelian" element={<LaporanPembelian />} />
        <Route path="/laporan-stok" element={<LaporanStok />} />
        <Route path="/stok-kadaluarsa" element={<StokKadaluarsa />} />
        <Route path="/kelola-supplier" element={<KelolaSupplier />} />
        <Route path="/kelola-kurir" element={<KelolaKurir />} />
        <Route path="/kelola-kategori-satuan" element={<KelolaKategoriSatuan />} />
        <Route path="/kelola-akun" element={<KelolaAkun />} />
        <Route path="/kurir" element={<Kurir />} />
        <Route path="/riwayat-kurir" element={<RiwayatKurir />} />
        <Route path="/grafik-penjualan" element={<GrafikPenjualan />} />
        <Route path="/obat-terlaris" element={<ObatTerlaris />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;