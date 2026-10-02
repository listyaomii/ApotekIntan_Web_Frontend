import "./../styles/login.css";
import avatar from "../assets/img/logoFarmasi.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffLogin } from "../services/authService";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await staffLogin(email, pin);
      if (result.status === "success") {
        localStorage.setItem("authToken", result.data.token);
        localStorage.setItem("userRole", result.data.role);
        localStorage.setItem(
          "userName",
          result.data.nama ?? result.data.pegawai?.nama ?? ""
        );
        localStorage.setItem(
          "userId",
          String(result.data.pegawai?.id ?? result.data.pegawai?.id_pegawai ?? "")
        );

        if (result.data.role === "owner") {
          navigate("/grafik-penjualan");
        } else if (result.data.role === "kurir") {
          navigate("/kurir");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.message || "Login gagal. Periksa email dan PIN Anda.");
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Login gagal. Coba lagi nanti.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #8cce90 0%, #5ec9aa 40%, #29795a 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative circles */}
      <div style={{
        position: "absolute", top: "-80px", left: "-80px",
        width: "320px", height: "320px", borderRadius: "50%",
        background: "rgba(255,255,255,0.15)", filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", right: "-60px",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "rgba(255,255,255,0.10)", filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "10%",
        width: "180px", height: "180px", borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
      }} />

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 10,
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: "32px",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "0 8px 48px rgba(41,121,90,0.18), 0 1.5px 8px rgba(0,0,0,0.08)",
        padding: "48px 44px",
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Logo & avatar */}
        <img
          src={avatar}
          alt="illustration"
          style={{ width: "80px", height: "80px", marginBottom: "12px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", padding: "8px" }}
        />
        <h1 style={{
          fontSize: "1.6rem", fontWeight: "800", color: "#fff",
          letterSpacing: "0.02em", margin: "0 0 4px",
          textShadow: "0 2px 8px rgba(41,121,90,0.18)"
        }}>
          Apotek Intan
        </h1>
        <p style={{ color: "rgba(30, 60, 37, 0.85)", fontSize: "0.95rem", marginBottom: "32px" }}>
          Selamat datang kembali 👋
        </p>

        <form onSubmit={handleLogin} style={{ width: "100%" }}>
          {error && (
            <div style={{
              background: "rgba(255,80,80,0.15)",
              border: "1px solid rgba(255,80,80,0.35)",
              color: "#fff",
              borderRadius: "16px",
              padding: "10px 16px",
              fontSize: "0.875rem",
              marginBottom: "16px",
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "rgba(30, 60, 37, 0.85)", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda"
              required
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 16px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.25)",
                color: "#29795a",
                fontSize: "0.95rem",
                outline: "none",
                backdropFilter: "blur(4px)",
              }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", color: "rgba(30, 60, 37, 0.85)", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
              PIN
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN Anda"
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 48px 12px 16px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.25)",
                  color: "#29795a",
                  fontSize: "0.95rem",
                  outline: "none",
                  backdropFilter: "blur(4px)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(30, 60, 37, 0.85)",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "20px",
              border: "none",
              background: loading
                ? "rgba(255,255,255,0.3)"
                : "linear-gradient(135deg, #fff 0%, #e8fdf0 100%)",
              color: "#29795a",
              fontWeight: "700",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(41,121,90,0.18)",
              transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}