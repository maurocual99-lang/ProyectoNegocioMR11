import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

import logoNegocio from "./../imagenes/ChatGPT Image 20 jul 2026, 11_47_32.png";

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    console.log("Navegando a:", path); // DEBUG
    navigate(path);
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const menuItems = [
    { path: "/", label: "Inicio", icon: Home },
    { path: "/catalogo-producto", label: "Catálogo", icon: Package },
    { path: "/deudores", label: "Deudores", icon: Users },
    { path: "/caja", label: "Ventas", icon: ShoppingCart },
    { path: "/resumenes", label: "Resúmenes", icon: BarChart3 },
  ];

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "260px",
        height: "100vh",
        background: "linear-gradient(180deg, #189ad3 0%, #10709b 100%)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        boxShadow: "4px 0 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          textAlign: "center",
          background: "rgba(0, 0, 0, 0.03)",
        }}
      >
        <img
          src={logoNegocio}
          alt="Logo"
          style={{
            width: "110px",
            objectFit: "contain",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}
        />
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "24px 12px" }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              style={{
                width: "100%",
                padding: "12px 16px",
                marginBottom: "6px",
                border: "none",
                borderRadius: "12px",
                backgroundColor: isActive
                  ? "rgba(255, 255, 255, 0.2)"
                  : "transparent",
                color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transition: "all 0.25s ease",
                fontFamily: "inherit",
                fontWeight: isActive ? "600" : "500",
                boxShadow: isActive ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }
              }}
            >
              <Icon size={20} color={isActive ? "#ffffff" : "rgba(255, 255, 255, 0.8)"} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          textAlign: "center",
          fontSize: "12px",
          color: "rgba(255, 255, 255, 0.7)",
          background: "rgba(0, 0, 0, 0.02)",
        }}
      >
        <p style={{ margin: 0, fontWeight: "600", color: "#ffffff" }}>Mini Mercado Ruta 11</p>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px" }}>Gestiona tu negocio mejor</p>
      </div>
    </aside>
  );
}