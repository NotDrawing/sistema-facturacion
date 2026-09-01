import { useState, useCallback } from "react";
import { clientesAPI } from "../api";
import { usePaginatedAPI } from "../hooks/usePaginatedAPI";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import Paginacion from "../components/Paginacion";

const VACIO = { rfc: "", nombre: "", cp_fiscal: "", regimen: "601", email: "" };
const PAGE_SIZE = 10;

export default function Clientes() {
  const listarFn = useCallback((params) => clientesAPI.listar(params), []);
  const {
    datos: clientes,
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

  const abrirEditar = (cliente) => {
    setEditandoId(cliente.id);
    setForm({
      rfc: cliente.rfc || "",
      nombre: cliente.nombre || "",
      cp_fiscal: cliente.cp_fiscal || "",
      regimen: cliente.regimen || "601",
      email: cliente.email || "",
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
    if (!form.rfc || !form.nombre || !form.cp_fiscal || !form.regimen) {
      setErrForm("Todos los campos marcados son obligatorios");
      return;
    }
    if (form.rfc.length < 12 || form.rfc.length > 13) {
      setErrForm("El RFC debe tener 12 o 13 caracteres");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) await clientesAPI.actualizar(editandoId, form);
      else await clientesAPI.crear(form);
      cerrarModal();
      recargar();
    } catch (e) {
      setErrForm(e.response?.data?.error || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      await clientesAPI.eliminar(id);
      if (clientes.length === 1 && page > 1) irAPagina(page - 1);
      else recargar();
    } catch (e) {
      alert(e.response?.data?.error || "No se pudo eliminar el cliente");
    }
  };

  if (error && !clientes?.length) {
    return <div className="alert alert-error">⚠ {error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Clientes</h1>
          <p>
            Receptores del CFDI · {total} registrado{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-primary" onClick={abrirNuevo}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      {cargando && !clientes?.length ? (
        <Spinner texto="Cargando clientes..." />
      ) : !clientes?.length ? (
        <div className="card empty-state">
          <div className="empty-icon">👥</div>
          <p>No hay clientes registrados aún.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={abrirNuevo}
            style={{ marginTop: 12 }}
          >
            Agregar primer cliente
          </button>
        </div>
      ) : (
        <>
          <div className="table-wrap" style={{ opacity: cargando ? 0.6 : 1 }}>
            <table>
              <thead>
                <tr>
                  <th>RFC</th>
                  <th>Nombre / Razón social</th>
                  <th>CP fiscal</th>
                  <th>Régimen</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {c.rfc}
                    </td>
                    <td>{c.nombre}</td>
                    <td className="mono">{c.cp_fiscal}</td>
                    <td>
                      <span className="badge badge-blue">{c.regimen}</span>
                    </td>
                    <td
                      style={{
                        color: c.email ? undefined : "var(--text-muted)",
                      }}
                    >
                      {c.email || "—"}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="btn-info btn-sm"
                          onClick={() => abrirEditar(c)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => eliminar(c.id, c.nombre)}
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
          titulo={editandoId ? "Editar cliente" : "Nuevo cliente"}
          onCerrar={cerrarModal}
        >
          <label>RFC *</label>
          <input
            placeholder="XAXX010101000"
            value={form.rfc}
            onChange={(e) => cambiar("rfc", e.target.value.toUpperCase())}
            maxLength={13}
          />
          <label>Nombre / Razón social *</label>
          <input
            placeholder="EMPRESA EJEMPLO SA DE CV"
            value={form.nombre}
            onChange={(e) => cambiar("nombre", e.target.value.toUpperCase())}
          />
          <div className="form-row">
            <div>
              <label>CP fiscal *</label>
              <input
                placeholder="64000"
                value={form.cp_fiscal}
                onChange={(e) => cambiar("cp_fiscal", e.target.value)}
                maxLength={5}
              />
            </div>
            <div>
              <label>Régimen fiscal *</label>
              <select
                value={form.regimen}
                onChange={(e) => cambiar("regimen", e.target.value)}
              >
                <option value="601">601 — General de Ley PM</option>
                <option value="605">605 — Sueldos y Salarios</option>
                <option value="612">612 — Act. Empresariales</option>
                <option value="616">616 — Sin obligaciones</option>
                <option value="621">621 — Incorporación Fiscal</option>
                <option value="626">626 — RESICO</option>
              </select>
            </div>
          </div>
          <label>Email (opcional)</label>
          <input
            placeholder="contacto@empresa.com"
            value={form.email}
            onChange={(e) => cambiar("email", e.target.value)}
          />
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
