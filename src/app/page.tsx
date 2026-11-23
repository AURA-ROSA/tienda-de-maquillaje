import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getCategories, getProducts } from "@/lib/data.prisma";
import { CatalogView } from "@/components/CatalogView";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";

export const instant = false;

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = await verifyAdminToken(sessionToken);

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <main className="store-main">
      {/* 1. Barra superior de anuncios */}
      <div className="announcement-bar">
        ✨ Envíos a toda Colombia • Pedidos 100% seguros y directos por WhatsApp ✨
      </div>

      {/* 2. Barra de navegación */}
      <header className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="brand-logo-container">
            <Image
              src="/logo.jpg"
              alt="Aura Rosa Logo"
              width={160}
              height={50}
              className="brand-logo-img"
              priority
            />
          </Link>

          <nav className="navbar-actions">
            <Link href="#catalogo" className="category-tab-btn" style={{ padding: "6px 16px", textDecoration: "none" }}>
              Ver Catálogo
            </Link>
            <Link
              href="/admin"
              className="user-nav-btn"
              title={isAdmin ? "Panel de Administradora (Sesión activa)" : "Cuenta / Administradora"}
              aria-label="Acceso Dueña"
            >
              <span className="user-icon">👤</span>
              {isAdmin && <span className="admin-status-dot" title="Sesión activa" />}
            </Link>
          </nav>
        </div>
      </header>

      {/* 3. Hero Section (Inspirado en Lumière y la paleta Aura Rosa) */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-tag">Aura Rosa Cosmetics</span>
          <h1 className="hero-title">
            Belleza que resalta tu <em>esencia</em>
          </h1>
          <p className="hero-subtitle">
            Maquillaje de alta duración diseñado para tu brillo diario. Selecciona tus tonos
            favoritos y haz tu pedido en un solo clic por WhatsApp.
          </p>
          <a href="#catalogo" className="hero-cta-btn">
            Explorar Catálogo ✨
          </a>
        </div>
      </section>

      {/* 4. Barra de Valores y Compromisos */}
      <section className="value-props-bar">
        <div className="value-props-grid">
          <div className="value-prop-item">
            <span className="value-prop-icon">🌸</span>
            <div className="value-prop-text">
              <strong>Fórmulas de Larga Duración</strong>
              <span>Colores intensos que te acompañan todo el día</span>
            </div>
          </div>
          <div className="value-prop-item">
            <span className="value-prop-icon">🐰</span>
            <div className="value-prop-text">
              <strong>Cruelty Free</strong>
              <span>Belleza responsable y libre de crueldad</span>
            </div>
          </div>
          <div className="value-prop-item">
            <span className="value-prop-icon">💬</span>
            <div className="value-prop-text">
              <strong>Atención por WhatsApp</strong>
              <span>Atención humana y cercana sin trámites complicados</span>
            </div>
          </div>
          <div className="value-prop-item">
            <span className="value-prop-icon">🇨🇴</span>
            <div className="value-prop-text">
              <strong>Envíos Nacionales</strong>
              <span>Llegamos a cualquier rincón de Colombia</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Catálogo conectado a PostgreSQL */}
      <CatalogView categories={categories} products={products} />

      {/* 6. Pie de Página */}
      <footer style={{ background: "#2A2426", color: "#E8D8CF", padding: "40px 24px", textAlign: "center" }}>
        <p style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" }}>
          AURA ROSA
        </p>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#B8A8A0" }}>
          Brilla con tu esencia. Irradia tu aura.
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "#8E7D83" }}>
          © {new Date().getFullYear()} Aura Rosa. Todos los derechos reservados. •{" "}
          <Link href="/admin" style={{ color: "#7E6C72", textDecoration: "none" }}>
            Acceso Administradora
          </Link>
        </p>
      </footer>

      {/* 7. Píldora Flotante Inteligente para la Dueña (solo cuando tiene sesión iniciada) */}
      {isAdmin && (
        <Link href="/admin" className="admin-floating-pill" title="Ir al panel de administración">
          <span className="pill-crown">👑</span>
          <span className="pill-text">Panel Dueña</span>
          <span className="pill-arrow">→</span>
        </Link>
      )}
    </main>
  );
}
