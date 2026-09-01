import { useState, useEffect } from "react";
import { clientesAPI, facturasAPI, productosAPI } from "../api";
import Spinner from "../components/Spinner";

export default function NuevaFactura() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargandoProd, setCargandoProd] = useState(true);
  const [clienteId, setClienteId] = useState("");
  const [modo, setModo] = useState("simulado");
  const [usoCFDI, setUsoCFDI] = useState("G03");
  const [metodoPago, setMetodoPago] = useState("PUE");
  const [formaPago, setFormaPago] = useState("03");
  const [conceptos, setConceptos] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoCli, setCargandoCli] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const opts = { page: 1, limit: 100 };

    clientesAPI
      .listar(opts)
      .then((r) => {
        const lista = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setClientes(lista);
      })
      .catch((e) => console.error("Error clientes:", e))
      .finally(() => setCargandoCli(false));

    productosAPI
      .listar(opts)
      .then((r) => {
        const lista = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setProductos(lista);
      })
      .catch((e) => console.error("Error productos:", e))
      .finally(() => setCargandoProd(false));
  }, []);

  const agregarConcepto = () =>
    setConceptos([
      ...conceptos,
      {
        producto_id: null,
        clave_sat: "",
        clave_unidad: "E48",
        descripcion: "",
        cantidad: 1,
        valor_unit: 0,
        objeto_imp: "02",
      },
    ]);

  const cambiar = (i, campo, valor) => {
    const nuevo = [...conceptos];
    nuevo[i] = { ...nuevo[i], [campo]: valor };
    if (campo !== "cantidad" && campo !== "producto_id")
      nuevo[i].producto_id = null;
    setConceptos(nuevo);
  };

  const seleccionarProducto = (i, productoId) => {
    const nuevo = [...conceptos];
    const p = productos.find((x) => String(x.id) === String(productoId));
    if (!p) {
      nuevo[i] = { ...nuevo[i], producto_id: null };
    } else {
      nuevo[i] = {
        ...nuevo[i],
        producto_id: p.id,
        descripcion: p.descripcion,
        clave_sat: p.clave_sat,
        clave_unidad: p.clave_unidad,
        valor_unit: parseFloat(p.precio),
        objeto_imp: p.objeto_imp || "02",
      };
    }
    setConceptos(nuevo);
  };

  const quitarConcepto = (i) =>
    setConceptos(conceptos.filter((_, idx) => idx !== i));

  const seleccionarCliente = (nuevoClienteId) => {
    setClienteId(nuevoClienteId);
    const cliente = clientes.find(
      (c) => String(c.id) === String(nuevoClienteId),
    );
    if (cliente?.rfc !== "XAXX010101000" && modo === "real")
      setModo("simulado");
  };

  const clienteSeleccionado = clientes.find(
    (c) => String(c.id) === String(clienteId),
  );
  const esPublicoGeneral = clienteSeleccionado?.rfc === "XAXX010101000";

  const subtotal = conceptos.reduce(
    (acc, c) => acc + c.cantidad * c.valor_unit,
    0,
  );
  const iva = conceptos.reduce(
    (acc, c) =>
      c.objeto_imp === "02" ? acc + c.cantidad * c.valor_unit * 0.16 : acc,
    0,
  );
  const total = subtotal + iva;

  const emitir = async () => {
    setError(null);
    setCargando(true);
    try {
      const { data } = await facturasAPI.emitir({
        clienteId,
        modo,
        conceptos,
        usoCFDI,
        metodoPago,
        formaPago,
      });
      setResultado(data);
    } catch (e) {
      setError(e.response?.data?.error || "Error al emitir la factura");
    } finally {
      setCargando(false);
    }
  };

  const nuevaFactura = () => {
    setResultado(null);
    setConceptos([]);
    setClienteId("");
  };

  if (resultado) {
    const esReal = resultado.modo === "real";
    return (
      <div className="result-screen">
        <div className={`result-icon ${esReal ? "real" : "sim"}`}>
          {esReal ? "✅" : "🧪"}
        </div>
        <h2
          style={{
            color: esReal ? "var(--success-text)" : "var(--warning-text)",
          }}
        >
          {esReal ? "Factura timbrada" : "Factura simulada"}
        </h2>
        <span className={`badge ${esReal ? "badge-green" : "badge-yellow"}`}>
          {esReal
            ? "REAL — pasó por Facturama"
            : "SIMULADA — no se envió a Facturama"}
        </span>
        <div
          className="card"
          style={{ textAlign: "left", marginTop: "1.5rem" }}
        >
          <p
            style={{
              marginBottom: 4,
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            UUID{esReal ? "" : " (simulado)"}
          </p>
          <div className="result-uuid">{resultado.uuid}</div>
          <a
            href={facturasAPI.xmlUrl(resultado.facturaId)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary btn-block"
            style={{ textDecoration: "none" }}
          >
            ⬇ Descargar XML
          </a>
        </div>
        <button
          className="btn-secondary"
          onClick={nuevaFactura}
          style={{ marginTop: "1rem" }}
        >
          + Emitir otra factura
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Nueva factura CFDI 4.0</h1>
          <p>Completa los datos del receptor, pago y conceptos para emitir</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <span className="step">1</span> Modo de emisión
        </h3>
        <div className="mode-grid">
          <label
            className={`mode-option ${modo === "simulado" ? "selected" : ""}`}
          >
            <input
              type="radio"
              checked={modo === "simulado"}
              onChange={() => setModo("simulado")}
            />
            <span>
              <strong>🧪 Simulada</strong>
              <small>
                No se envía a Facturama. Ideal para pruebas ilimitadas.
              </small>
            </span>
          </label>
          <label
            className={`mode-option ${modo === "real" ? "selected" : ""} ${!esPublicoGeneral ? "disabled" : ""}`}
          >
            <input
              type="radio"
              checked={modo === "real"}
              disabled={!esPublicoGeneral}
              onChange={() => setModo("real")}
            />
            <span>
              <strong>✅ Real (Facturama)</strong>
              <small>
                {esPublicoGeneral
                  ? "Se timbra de verdad en el sandbox del PAC."
                  : "Solo disponible para Público en General (XAXX010101000)."}
              </small>
            </span>
          </label>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <span className="step">2</span> Receptor
        </h3>
        <label>Cliente *</label>
        {cargandoCli ? (
          <Spinner texto="Cargando clientes..." />
        ) : (
          <select
            value={clienteId}
            onChange={(e) => seleccionarCliente(e.target.value)}
          >
            <option value="">— Selecciona un cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.rfc}
              </option>
            ))}
          </select>
        )}
        <label>Uso del CFDI *</label>
        <select value={usoCFDI} onChange={(e) => setUsoCFDI(e.target.value)}>
          <option value="G01">G01 — Adquisición de mercancías</option>
          <option value="G02">
            G02 — Devoluciones, descuentos o bonificaciones
          </option>
          <option value="G03">G03 — Gastos en general</option>
          <option value="I01">I01 — Construcciones</option>
          <option value="I02">I02 — Mobiliario y equipo de oficina</option>
          <option value="I03">I03 — Equipo de transporte</option>
          <option value="I04">I04 — Equipo de cómputo</option>
          <option value="I08">I08 — Otra maquinaria y equipo</option>
          <option value="D01">D01 — Honorarios médicos y hospitalarios</option>
          <option value="D10">D10 — Servicios educativos (colegiaturas)</option>
          <option value="P01">P01 — Por definir</option>
          <option value="S01">S01 — Sin efectos fiscales</option>
          <option value="CP01">CP01 — Pagos</option>
        </select>
      </div>

      <div className="card">
        <h3 className="card-title">
          <span className="step">3</span> Condiciones de pago
        </h3>
        <div className="form-row">
          <div>
            <label>Método de pago *</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
            >
              <option value="PUE">PUE — Pago en una sola exhibición</option>
              <option value="PPD">
                PPD — Pago en parcialidades o diferido
              </option>
            </select>
          </div>
          {metodoPago === "PUE" && (
            <div>
              <label>Forma de pago *</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
              >
                <option value="01">01 — Efectivo</option>
                <option value="02">02 — Cheque nominativo</option>
                <option value="03">03 — Transferencia electrónica</option>
                <option value="04">04 — Tarjeta de crédito</option>
                <option value="28">28 — Tarjeta de débito</option>
                <option value="29">29 — Tarjeta de servicios</option>
                <option value="99">99 — Por definir</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h3 className="card-title" style={{ margin: 0 }}>
            <span className="step">4</span> Conceptos
          </h3>
          <button className="btn-soft btn-sm" onClick={agregarConcepto}>
            + Agregar concepto
          </button>
        </div>

        {conceptos.length === 0 && (
          <div className="empty-state" style={{ padding: "1.5rem" }}>
            <p>Agrega al menos un concepto para poder emitir.</p>
            <button
              className="btn-soft"
              onClick={agregarConcepto}
              style={{ marginTop: 8 }}
            >
              + Primer concepto
            </button>
          </div>
        )}

        {conceptos.map((c, i) => (
          <div key={i} className="concepto-card">
            <div className="concepto-card-header">
              <strong>Concepto {i + 1}</strong>
              <button
                className="btn-danger btn-sm"
                onClick={() => quitarConcepto(i)}
                style={{ padding: "2px 8px" }}
              >
                ✕
              </button>
            </div>
            <label>Producto del catálogo (opcional)</label>
            <select
              value={c.producto_id || ""}
              onChange={(e) => seleccionarProducto(i, e.target.value)}
              disabled={cargandoProd}
            >
              <option value="">— Escribir manualmente —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descripcion} — $
                  {parseFloat(p.precio).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </option>
              ))}
            </select>
            <label>Descripción</label>
            <input
              placeholder="Servicio de consultoría"
              value={c.descripcion}
              onChange={(e) => cambiar(i, "descripcion", e.target.value)}
            />
            <div className="form-row">
              <div>
                <label>Clave SAT</label>
                <input
                  placeholder="80141600"
                  value={c.clave_sat}
                  onChange={(e) => cambiar(i, "clave_sat", e.target.value)}
                  maxLength={8}
                />
              </div>
              <div>
                <label>Clave unidad</label>
                <select
                  value={c.clave_unidad}
                  onChange={(e) => cambiar(i, "clave_unidad", e.target.value)}
                >
                  <option value="E48">E48 — Servicio</option>
                  <option value="H87">H87 — Pieza</option>
                  <option value="HUR">HUR — Hora</option>
                  <option value="KGM">KGM — Kilogramo</option>
                  <option value="MTR">MTR — Metro</option>
                  <option value="LTR">LTR — Litro</option>
                  <option value="ACT">ACT — Actividad</option>
                  <option value="XUN">XUN — Unidad</option>
                </select>
              </div>
              <div>
                <label>Cantidad</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={c.cantidad}
                  onChange={(e) =>
                    cambiar(i, "cantidad", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label>Precio unitario (sin IVA)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={c.valor_unit}
                  onChange={(e) =>
                    cambiar(i, "valor_unit", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <label>Objeto de impuesto</label>
            <select
              value={c.objeto_imp}
              onChange={(e) => cambiar(i, "objeto_imp", e.target.value)}
            >
              <option value="02">02 — Sí objeto de impuesto (IVA 16%)</option>
              <option value="01">01 — No objeto de impuesto (exento)</option>
              <option value="03">
                03 — Sí objeto, no obligado a desglosar
              </option>
            </select>
            <p className="concepto-importe">
              Importe: $
              {(c.cantidad * c.valor_unit).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        ))}

        {conceptos.length > 0 && (
          <div className="totales-box">
            <div className="total-row">
              <span>Subtotal</span>
              <span>
                $
                {subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="total-row">
              <span>IVA (16%)</span>
              <span>
                ${iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="total-row grand">
              <span>Total</span>
              <span>
                ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
                MXN
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <button
        className="btn-primary btn-block"
        onClick={emitir}
        disabled={cargando || !clienteId || conceptos.length === 0}
      >
        {cargando
          ? modo === "real"
            ? "⏳ Timbrando con Facturama..."
            : "⏳ Generando factura simulada..."
          : modo === "real"
            ? "🧾 Emitir factura (Real)"
            : "🧪 Emitir factura simulada"}
      </button>
    </div>
  );
}
