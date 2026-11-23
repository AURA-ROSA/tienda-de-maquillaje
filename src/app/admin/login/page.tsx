"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAdminAction } from "@/actions/auth-actions";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await loginAdminAction(password);

      if (!res.ok) {
        setErrorMsg(res.error ?? "Contraseña incorrecta");
        setLoading(false);
        return;
      }

      // Redirigir al panel administrativo
      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMsg("Ocurrió un error al procesar el ingreso.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FFF8F5 0%, #FAF5F0 100%)",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(420px, 100%)",
          background: "white",
          borderRadius: "24px",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          boxShadow: "0 14px 40px rgba(78, 48, 59, 0.08)",
          padding: "36px 28px",
          textAlign: "center",
        }}
      >
        {/* Logo Aura Rosa */}
        <div style={{ marginBottom: "20px" }}>
          <Image
            src="/logo.jpg"
            alt="Aura Rosa"
            width={160}
            height={55}
            style={{ objectFit: "contain", margin: "0 auto" }}
            priority
          />
        </div>

        <span
          style={{
            display: "inline-block",
            background: "#FFF0F5",
            color: "#D63378",
            fontSize: "12px",
            fontWeight: "bold",
            padding: "4px 12px",
            borderRadius: "999px",
            marginBottom: "12px",
            letterSpacing: "0.5px",
          }}
        >
          🔒 Acceso Administrativo
        </span>

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "24px",
            color: "#1F191B",
            margin: "0 0 8px",
          }}
        >
          Panel de la Dueña
        </h1>

        <p
          style={{
            fontSize: "13px",
            color: "#7E6C72",
            margin: "0 0 24px",
            lineHeight: "1.5",
          }}
        >
          Ingresa la contraseña de administradora para ver pedidos y controlar el inventario.
        </p>

        {errorMsg && (
          <div
            style={{
              background: "#FFEBEE",
              color: "#C62828",
              fontSize: "13px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #FFCDD2",
              marginBottom: "18px",
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ textAlign: "left" }}>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#2A2426",
                marginBottom: "6px",
              }}
            >
              Contraseña de Administradora
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoFocus
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #EEDFD6",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #D63378 0%, #E83F86 100%)",
              color: "white",
              border: 0,
              padding: "13px",
              borderRadius: "999px",
              fontWeight: "bold",
              fontSize: "15px",
              boxShadow: "0 6px 18px rgba(214, 51, 120, 0.28)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verificando..." : "Entrar al Panel ✨"}
          </button>
        </form>

        <div style={{ marginTop: "24px", borderTop: "1px solid #F5EDF0", paddingTop: "16px" }}>
          <Link
            href="/"
            style={{
              color: "#7E6C72",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ← Volver a la Tienda Pública
          </Link>
        </div>
      </div>
    </div>
  );
}
