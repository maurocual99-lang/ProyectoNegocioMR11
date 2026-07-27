import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  DollarSign,
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
        backgroundColor: "#fff",
        borderRight: "1px solid #e5e7eb",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        <img
          src={logoNegocio}
          alt="Logo"
          style={{
            width: "120px",
          }}
        />
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "20px 0" }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              style={{
                width: "100%",
                padding: "12px 20px",
                marginBottom: "8px",
                border: "none",
                backgroundColor: isActive
                  ? "rgba(37, 99, 235, 0.1)"
                  : "transparent",
                borderLeft: isActive ? "4px solid #2563eb" : "4px solid transparent",
                color: isActive ? "#2563eb" : "#333",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                fontWeight: isActive ? "600" : "400",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <p style={{ margin: 0 }}>Mini Mercado Ruta 11</p>
        <p style={{ margin: "5px 0 0 0" }}>Gestiona tu negocio mejor</p>
      </div>
    </aside>
  );
}