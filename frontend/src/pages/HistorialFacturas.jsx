import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { facturasAPI } from "../api";
import { usePaginatedAPI } from "../hooks/usePaginatedAPI";
import Spinner from "../components/Spinner";
import Paginacion from "../components/Paginacion";

const PAGE_SIZE = 10;

export default function HistorialFacturas() {
  const navigate = useNavigate();
  const listarFn = useCallback((params) => facturasAPI.listar(params), []);
  const {
    datos: facturas,
    total,
    page,
    totalPages,
    limit,
    cargando,
    error,
    irAPagina,
    recargar,
  } = usePaginatedAPI(listarFn, { limit: PAGE_SIZE });

  if (error && !facturas?.length) {
    return <div className="alert alert-error">⚠ {error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Historial de facturas</h1>
          <p>Comprobantes emitidos · {total} en total</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={recargar}
            disabled={cargando}
          >
            ↺ Recargar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/")}
          >
            + Nueva factura
          </button>
        </div>
      </div>

      {cargando && !facturas?.length ? (
        <Spinner texto="Cargando facturas..." />
      ) : !facturas?.length ? (
        <div className="card empty-state">
          <div className="empty-icon">🧾</div>
          <p>Aún no hay facturas emitidas.</p>
          <Link to="/" style={{ fontWeight: 600 }}>
            Emitir la primera factura →
          </Link>
        </div>
      ) : (
        <>
          <div className="table-wrap" style={{ opacity: cargando ? 0.6 : 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Modo</th>
                  <th>Estado</th>
                  <th>UUID</th>
                  <th>XML</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {f.serie}
                      {f.folio}
                    </td>
                    <td>{f.cliente_nombre}</td>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {new Date(f.fecha).toLocaleString("es-MX")}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      $
                      {parseFloat(f.total).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          f.modo === "real" ? "badge-green" : "badge-yellow"
                        }`}
                      >
                        {f.modo === "real" ? "Real" : "Simulada"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          f.estado === "timbrada"
                            ? "badge-green"
                            : f.estado === "error"
                              ? "badge-red"
                              : "badge-yellow"
                        }`}
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td className="mono" style={{ color: "var(--text-muted)" }}>
                      {f.uuid ? f.uuid.slice(0, 13) + "…" : "—"}
                    </td>
                    <td>
                      {f.uuid && (
                        <a
                          href={facturasAPI.xmlUrl(f.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-soft btn-sm"
                          style={{ textDecoration: "none" }}
                        >
                          ⬇XML
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onChange={irAPagina}
            cargando={cargando}
          />
        </>
      )}
    </div>
  );
}
