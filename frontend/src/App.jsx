import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import NuevaFactura from "./pages/NuevaFactura";
import HistorialFacturas from "./pages/HistorialFacturas";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";

const links = [
  { to: "/", label: "Nueva factura", icon: "🧾", end: true },
  { to: "/facturas", label: "Historial", icon: "📋" },
  { to: "/clientes", label: "Clientes", icon: "👥" },
  { to: "/productos", label: "Productos", icon: "📦" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">📄</div>
            <div className="sidebar-brand-text">
              <strong>FacturaCFDI</strong>
              <span>CFDI 4.0 · Demo</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                <span className="nav-icon">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            Sistema de facturación demo
            <br />
            Simulado · Facturama sandbox
          </div>
        </aside>

        <div className="main-area">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<NuevaFactura />} />
              <Route path="/facturas" element={<HistorialFacturas />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/productos" element={<Productos />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
