# Manual de uso — FacturaCFDI (demo CFDI 4.0 · Facturama)

Sistema de facturación electrónica de demostración. Emite comprobantes **CFDI 4.0** en dos modos: **simulado** (sin consumir timbres) y **real** (sandbox de Facturama, solo Público en General).

---

## 1. Qué incluye la demo actual

| Área | Descripción |
|------|-------------|
| **Nueva factura** | Formulario de emisión con selector de modo, receptor, uso CFDI, pago y conceptos |
| **Historial** | Listado paginado de facturas con modo, estado, UUID y descarga de XML |
| **Clientes** | Alta, edición y baja de receptores (paginado) |
| **Productos** | Catálogo de productos/servicios con claves SAT (paginado) |
| **Backend** | Express + PostgreSQL, firma con CSD de pruebas, simulador local y PAC Facturama |
| **Frontend** | React + Vite, interfaz con menú lateral **FacturaCFDI** |

### Modo simulado vs modo real

| | **Simulado** (recomendado en la demo) | **Real** |
|---|--------------------------------------|----------|
| ¿Llama a Facturama? | No | Sí (sandbox) |
| UUID | Ficticio (`crypto.randomUUID()`) | Asignado por el PAC |
| XML | Firmado con CSD de pruebas + timbre marcado `SIMULADO` | Timbrado en sandbox |
| ¿Válido ante el SAT? | **No** | Solo como prueba de sandbox |
| ¿Quién puede usarlo? | Cualquier cliente | **Solo** RFC `XAXX010101000` (Público en General) |

Si eliges modo real con otro cliente, el frontend lo fuerza a simulado y el backend responde **400** si se intenta forzar.

### Emisor de pruebas (CSD)

Tras ejecutar el script de carga de CSD:

- **RFC:** `EKU9003173C9`
- **Nombre:** ESCUELA KEMPER URGATE
- **Régimen:** 601 · **CP:** 03100

---

## 2. Requisitos

- **Node.js** 18 o superior  
- **PostgreSQL** en ejecución  
- Gestor de paquetes: **pnpm** (recomendado), o `npm` / `yarn`  
- Credenciales de sandbox Facturama (solo para modo real)

---

## 3. Puesta en marcha

### 3.1 Base de datos

Crea la base y aplica las migraciones **en orden**:

```bash
# Ejemplo con psql
createdb facturacion_db   # o el nombre que uses en .env

cd backend
psql -h localhost -U postgres -d facturacion_db -f src/db/migrations/001_crear_tablas.sql
psql -h localhost -U postgres -d facturacion_db -f src/db/migrations/002_datos_prueba.sql
psql -h localhost -U postgres -d facturacion_db -f src/db/migrations/003_corregir_clientes_personas_morales.sql
psql -h localhost -U postgres -d facturacion_db -f src/db/migrations/004_clientes_prueba_validos.sql
psql -h localhost -U postgres -d facturacion_db -f src/db/migrations/005_modo_emision.sql
psql -h localhost -U postgres -d facturacion_db -f src/db/migrations/006_datos_prueba_completos.sql
psql -h localhost -U postgres -d facturacion_db -f src/db/migrations/007_factura_conceptos_descriptivo.sql
```

> Las migraciones `005` y `006` añaden el campo **modo** de emisión y datos de prueba ampliados. La `007` mejora la descripción de conceptos en factura.

### 3.2 Variables de entorno (`backend/.env`)

El backend **no** usa `DATABASE_URL`. Usa variables sueltas de Postgres:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=facturacion_db
DB_USER=postgres
DB_PASSWORD=12345

JWT_SECRET=cambia_este_secreto

# Sandbox Facturama (solo necesario para modo real)
PAC_USER=tu_usuario_sandbox
PAC_PASS=tu_password_sandbox

# Series y folios
FACTURAMA_SERIE=A
FACTURAMA_SERIE_SIMULADA=SIM
FACTURAMA_FOLIO_INICIAL=1
```

| Variable | Uso |
|----------|-----|
| `FACTURAMA_SERIE` | Serie de facturas **reales** (ej. `A` o `B`) |
| `FACTURAMA_SERIE_SIMULADA` | Serie de facturas **simuladas** (por defecto `SIM`) |
| `FACTURAMA_FOLIO_INICIAL` | Folio inicial para el contador del PAC en sandbox |

### 3.3 Backend

```bash
cd backend

# Con pnpm (recomendado)
pnpm install
node scripts/descargar-xslt.js    # XSLT del SAT (una sola vez)
node scripts/cargar-csd-bd.js     # CSD de pruebas en tabla emisor
pnpm dev                          # http://localhost:3001

# Equivalentes npm / yarn
# npm install  &&  npm run dev
# yarn install &&  yarn dev
```

Scripts útiles del `package.json` del backend:

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `nodemon src/index.js` | Desarrollo con recarga |
| `start` | `node src/index.js` | Producción / demo estable |
| `setup` | `node scripts/descargar-xslt.js` | Descarga del XSLT |

### 3.4 Frontend

```bash
cd frontend
pnpm install
pnpm dev
# Abrir la URL que muestre Vite (normalmente http://localhost:5173)
```

La API del frontend apunta a `http://localhost:3001/api`. Backend y frontend deben estar levantados a la vez.

---

## 4. Cómo usar la aplicación (flujo de demo)

Menú lateral:

1. **Nueva factura**  
2. **Historial**  
3. **Clientes**  
4. **Productos**  

### Paso 1 — Clientes

**Clientes** → **+ Nuevo cliente**.

| Campo | Ejemplo | Notas |
|-------|---------|--------|
| RFC | `JUMA8001137N1` | 12 o 13 caracteres |
| Nombre / Razón social | `JUAN MANUEL PEREZ TORRES` | En MAYÚSCULAS |
| CP fiscal | `64000` | Domicilio fiscal |
| Régimen | `612` | Ver catálogo más abajo |
| Email | `juan.perez@ejemplo.com` | Opcional |

Ya existe el cliente de prueba **Público en General** (`XAXX010101000`): es el **único** con el que puedes emitir en modo **real**.

Listado con **paginación** (10 por página): anterior/siguiente, primera/última e indicador `1–10 de N`.

### Paso 2 — Productos y servicios

**Productos** → **+ Nuevo producto**.

| Campo | Ejemplo | Notas |
|-------|---------|--------|
| Descripción | `Desarrollo de software a medida` | Texto libre |
| Clave SAT | `43232408` | Catálogo `c_ClaveProdServ` |
| Clave unidad | `E48` | Servicio (ver catálogo) |
| Precio | `5000.00` | **Sin IVA** |
| Objeto de impuesto | `02` | Con IVA 16 % |

También paginado. Puedes editar o eliminar desde la tabla.

### Paso 3 — Emitir una factura

**Nueva factura**:

1. **Modo de emisión**  
   - **Simulada** — por defecto; no consume timbres.  
   - **Real** — solo si el receptor es Público en General; si no, la opción aparece deshabilitada.

2. **Receptor**  
   - Elige el cliente y el **Uso de CFDI** (ej. `G03` Gastos en general).

3. **Condiciones de pago**  
   - Método: `PUE` o `PPD`.  
   - Si es `PUE`, indica **Forma de pago** (ej. `03` Transferencia).

4. **Conceptos**  
   - Agrega renglones.  
   - Puedes cargar un producto del catálogo (rellena descripción, claves y precio) o capturar a mano.  
   - Cantidad, valor unitario y objeto de impuesto.

5. Pulsa **🧪 Emitir factura simulada** o **🧾 Emitir factura (Real)**.

6. En el resultado verás el UUID (y la leyenda de simulado si aplica) y el enlace para **descargar el XML**.

### Paso 4 — Historial

**Historial**:

- Columnas: Folio, Cliente, Fecha, Total, **Modo** (Simulada/Real), **Estado**, UUID, descarga XML.  
- **↺ Recargar** actualiza la lista.  
- **+ Nueva factura** vuelve al formulario de emisión.  
- Paginación igual que en Clientes y Productos.  
- XML simulado se descarga como `SIMULADA_<uuid>.xml` para no confundirlo con uno real.

---

## 5. Catálogos del formulario

### Uso de CFDI (`c_UsoCFDI`)

| Clave | Descripción |
|-------|-------------|
| G01 | Adquisición de mercancías |
| G02 | Devoluciones, descuentos o bonificaciones |
| G03 | Gastos en general |
| I01 | Construcciones |
| I02 | Mobiliario y equipo de oficina |
| I03 | Equipo de transporte |
| I04 | Equipo de cómputo |
| I08 | Otra maquinaria y equipo |
| D01 | Honorarios médicos, dentales y hospitalarios |
| D10 | Pagos por servicios educativos (colegiaturas) |
| P01 | Por definir |
| S01 | Sin efectos fiscales |
| CP01 | Pagos |

> Con receptor **Público en General** en modo **real**, el backend fuerza **Uso CFDI = S01** (regla SAT/PAC), aunque en pantalla hayas elegido otra clave.

### Clave de unidad (`c_ClaveUnidad`, extracto)

| Clave | Descripción |
|-------|-------------|
| E48 | Unidad de servicio |
| H87 | Pieza |
| HUR | Hora |
| KGM | Kilogramo |
| MTR | Metro |
| LTR | Litro |
| ACT | Actividad |
| XUN | Unidad |

### Objeto de impuesto (`c_ObjetoImp`)

| Clave | Descripción |
|-------|-------------|
| 01 | No objeto de impuesto (sin IVA) |
| 02 | Sí objeto de impuesto (IVA 16 %) |
| 03 | Sí objeto y no obligado al desglose |

### Forma de pago (`c_FormaPago`)

| Clave | Descripción |
|-------|-------------|
| 01 | Efectivo |
| 02 | Cheque nominativo |
| 03 | Transferencia electrónica de fondos |
| 04 | Tarjeta de crédito |
| 28 | Tarjeta de débito |
| 29 | Tarjeta de servicios |
| 99 | Por definir |

### Método de pago (`c_MetodoPago`)

| Clave | Descripción |
|-------|-------------|
| PUE | Pago en una sola exhibición |
| PPD | Pago en parcialidades o diferido (no exige forma de pago al timbrar) |

### Régimen fiscal (los más usados en la demo)

| Clave | Descripción |
|-------|-------------|
| 601 | General de Ley Personas Morales |
| 605 | Sueldos y Salarios |
| 612 | Personas Físicas con Actividades Empresariales y Profesionales |
| 616 | Sin obligaciones fiscales (Público en General) |
| 621 | Incorporación Fiscal |
| 626 | Régimen Simplificado de Confianza (RESICO) |

---

## 6. Reglas de negocio a recordar (y a explicar en presentación)

1. **Solo Público en General** (`XAXX010101000`) puede timbrarse en modo **real**. Cualquier otro RFC se emite en simulado; el backend lo valida aunque el cliente manipule la petición.  
2. En modo real con Público en General:  
   - Uso CFDI → `S01`  
   - Régimen del receptor → `616`  
   - CP fiscal del receptor → se alinea con el del emisor (regla del PAC)  
3. Facturas simuladas usan la serie `SIM` (o `FACTURAMA_SERIE_SIMULADA`) para no mezclarse con folios reales.  
4. El XML simulado **no es válido ante el SAT**: el timbre lleva `RfcProvCertif=SIMULADO` y un `SelloSAT` explícitamente de prueba. Sirve para demostrar descarga y flujo completo.  
5. Listados de **Historial**, **Clientes** y **Productos** están **paginados** (10 registros por página).

---

## 7. Guion sugerido para una presentación en vivo

1. **Contexto (1 min)**  
   Demo de CFDI 4.0: alta de clientes/productos, emisión simulada y, opcionalmente, un timbre real en sandbox.

2. **Recorrido de pantallas**  
   Menú: Nueva factura → Historial → Clientes → Productos.

3. **Alta rápida**  
   Un cliente de prueba y un producto (o usar los ya cargados por migraciones).

4. **Emisión simulada**  
   Modo Simulada → cliente cualquiera → conceptos → emitir → mostrar UUID y descargar XML `SIMULADA_…`.

5. **Historial**  
   Badge de modo/estado, paginación y descarga.

6. **(Opcional) Emisión real**  
   Cliente Público en General → modo Real → emitir → contrastar con la simulada (serie, nombre del XML, estado `timbrada`).

7. **Cierre**  
   Simulado = demo sin costo de timbres; real = prueba de integración PAC; el XML simulado no se presenta ante el SAT.

---

## 8. Solución de problemas frecuentes

| Problema | Qué revisar |
|----------|-------------|
| Frontend no carga datos | Backend en `:3001`; consola del navegador (CORS o conexión) |
| Error de Postgres al arrancar | `DB_*` en `.env`; servicio PostgreSQL activo; migraciones aplicadas |
| Modo Real deshabilitado | El cliente seleccionado debe ser `XAXX010101000` |
| Error 400 al emitir real | Backend rechazó un RFC que no es Público en General |
| Fallo al timbrar real | `PAC_USER` / `PAC_PASS` de sandbox; red hacia Facturama |
| XML / cadena original | Ejecutar `node scripts/descargar-xslt.js` y `node scripts/cargar-csd-bd.js` |
| Listados vacíos tras migrar | Correr migraciones `002`, `004` y `006` (datos de prueba) |

---

## 9. Estructura del proyecto (referencia)

```
sistema-facturacion/
├── MANUAL_USO.md          ← este documento
├── backend/
│   ├── .env
│   ├── package.json
│   ├── scripts/
│   │   ├── descargar-xslt.js
│   │   └── cargar-csd-bd.js
│   ├── assets/            # XSLT, CSD de pruebas
│   └── src/
│       ├── index.js
│       ├── config/db.js
│       ├── controllers/
│       ├── routes/
│       ├── services/      # cfdi, firma, simulador, pac, cadena
│       └── db/migrations/ # 001 … 007
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx        # menú lateral y rutas
        ├── index.css
        ├── api/
        ├── components/    # Modal, Spinner, Paginacion
        ├── hooks/
        └── pages/         # NuevaFactura, Historial, Clientes, Productos
```

---

*Demo orientada a presentación y pruebas. No usar credenciales ni CSD de producción en este entorno.*
