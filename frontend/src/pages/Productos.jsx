import { useState, useCallback } from "react";
import { productosAPI } from "../api";
import { usePaginatedAPI } from "../hooks/usePaginatedAPI";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import Paginacion from "../components/Paginacion";

const VACIO = {
  descripcion: "",
  clave_sat: "",
  clave_unidad: "E48",
  precio: "",
  objeto_imp: "02",
};
const PAGE_SIZE = 10;

export default function Productos() {
  const listarFn = useCallback((params) => productosAPI.listar(params), []);
  const {
    datos: productos,
    total,
    page,
    totalPages,
    limit,
    cargando,
    error,
    irAPagina,
    recargar,
  } = usePaginatedAPI(listarFn, { limit: PAGE_SIZE });

  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errForm, setErrForm] = useState(null);

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm(VACIO);
    setErrForm(null);
    setModal(true);
  };

  const abrirEditar = (producto) => {
    setEditandoId(producto.id);
    setForm({
      descripcion: producto.descripcion || "",
      clave_sat: producto.clave_sat || "",
      clave_unidad: producto.clave_unidad || "E48",
      precio: producto.precio ?? "",
      objeto_imp: producto.objeto_imp || "02",
    });
    setErrForm(null);
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditandoId(null);
  };

  const cambiar = (campo, val) => setForm((f) => ({ ...f, [campo]: val }));

  const guardar = async () => {
    if (!form.descripcion || !form.clave_sat || !form.precio) {
      setErrForm("Descripción, clave SAT y precio son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) await productosAPI.actualizar(editandoId, form);
      else await productosAPI.crear(form);
      cerrarModal();
      recargar();
    } catch (e) {
      setErrForm(e.response?.data?.error || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id, desc) => {
    if (!confirm(`¿Eliminar "${desc}"?`)) return;
    try {
      await productosAPI.eliminar(id);
      if (productos.length === 1 && page > 1) irAPagina(page - 1);
      else recargar();
    } catch (e) {
      alert(e.response?.data?.error || "No se pudo eliminar el producto");
    }
  };

  if (error && !productos?.length) {
    return <div className="alert alert-error">⚠ {error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Productos y servicios</h1>
          <p>
            Catálogo SAT · {total} activo{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-primary" onClick={abrirNuevo}>
            + Nuevo producto
          </button>
        </div>
      </div>

      {cargando && !productos?.length ? (
        <Spinner texto="Cargando productos..." />
      ) : !productos?.length ? (
        <div className="card empty-state">
          <div className="empty-icon">📦</div>
          <p>No hay productos registrados aún.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={abrirNuevo}
            style={{ marginTop: 12 }}
          >
            Agregar primer producto
          </button>
        </div>
      ) : (
        <>
          <div className="table-wrap" style={{ opacity: cargando ? 0.6 : 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Clave SAT</th>
                  <th>Unidad</th>
                  <th>Precio</th>
                  <th>Impuesto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.descripcion}</td>
                    <td className="mono">{p.clave_sat}</td>
                    <td className="mono">{p.clave_unidad}</td>
                    <td style={{ fontWeight: 600 }}>
                      $
                      {parseFloat(p.precio).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.objeto_imp === "02" ? "badge-green" : "badge-yellow"
                        }`}
                      >
                        {p.objeto_imp === "02"
                          ? "Con IVA"
                          : p.objeto_imp === "01"
                            ? "Exento"
                            : "Sin desglose"}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="btn-info btn-sm"
                          onClick={() => abrirEditar(p)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => eliminar(p.id, p.descripcion)}
                        >
                          Eliminar
                        </button>
                      </div>
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

      {modal && (
        <Modal
          titulo={
            editandoId
              ? "Editar producto / servicio"
              : "Nuevo producto / servicio"
          }
          onCerrar={cerrarModal}
        >
          <label>Descripción *</label>
          <input
            placeholder="Servicio de consultoría tecnológica"
            value={form.descripcion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
          />
          <div className="form-row">
            <div>
              <label>Clave SAT *</label>
              <input
                placeholder="80141600"
                value={form.clave_sat}
                onChange={(e) => cambiar("clave_sat", e.target.value)}
                maxLength={8}
              />
            </div>
            <div>
              <label>Clave unidad</label>
              <select
                value={form.clave_unidad}
                onChange={(e) => cambiar("clave_unidad", e.target.value)}
              >
                <option value="E48">E48 — Servicio</option>
                <option value="H87">H87 — Pieza</option>
                <option value="HUR">HUR — Hora</option>
                <option value="KGM">KGM — Kilogramo</option>
                <option value="LTR">LTR — Litro</option>
                <option value="MTR">MTR — Metro</option>
                <option value="ACT">ACT — Actividad</option>
                <option value="XUN">XUN — Unidad</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Precio unitario (sin IVA) *</label>
              <input
                type="number"
                placeholder="1000.00"
                value={form.precio}
                onChange={(e) => cambiar("precio", e.target.value)}
              />
            </div>
            <div>
              <label>Objeto de impuesto</label>
              <select
                value={form.objeto_imp}
                onChange={(e) => cambiar("objeto_imp", e.target.value)}
              >
                <option value="02">02 — Con IVA 16%</option>
                <option value="01">01 — Exento</option>
                <option value="03">03 — Sin desglose</option>
              </select>
            </div>
          </div>
          {errForm && <div className="alert alert-error">⚠ {errForm}</div>}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={cerrarModal}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={guardar}
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : editandoId
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
