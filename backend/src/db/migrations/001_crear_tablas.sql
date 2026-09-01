CREATE TABLE IF NOT EXISTS emisor (
    id SERIAL PRIMARY KEY,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    regimen VARCHAR(4) NOT NULL,
    cp VARCHAR(5) NOT NULL,
    cert_b64 TEXT,
    key_pem TEXT,
    no_cert VARCHAR(20),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    rfc VARCHAR(13) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    cp_fiscal VARCHAR(5) NOT NULL,
    regimen VARCHAR(4) NOT NULL,
    email VARCHAR(100),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
  id           SERIAL PRIMARY KEY,
  descripcion  VARCHAR(300) NOT NULL,
  clave_sat    VARCHAR(8) NOT NULL,
  clave_unidad VARCHAR(6) NOT NULL,
  precio       NUMERIC(12,2) NOT NULL,
  objeto_imp   VARCHAR(2) DEFAULT '02',
  activo       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS facturas (
  id           SERIAL PRIMARY KEY,
  serie        VARCHAR(10) DEFAULT 'A',
  folio        VARCHAR(20),
  fecha        TIMESTAMP NOT NULL,
  emisor_id    INT REFERENCES emisor(id),
  cliente_id   INT REFERENCES clientes(id),
  uso_cfdi     VARCHAR(4) NOT NULL,
  metodo_pago  VARCHAR(3) DEFAULT 'PUE',
  forma_pago   VARCHAR(2),
  moneda       VARCHAR(3) DEFAULT 'MXN',
  subtotal     NUMERIC(12,2),
  total        NUMERIC(12,2),
  uuid         VARCHAR(36),
  xml_timbrado TEXT,
  estado       VARCHAR(20) DEFAULT 'borrador',
  creado_en    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factura_conceptos (
  id         SERIAL PRIMARY KEY,
  factura_id INT REFERENCES facturas(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id),
  cantidad   NUMERIC(10,3) NOT NULL,
  valor_unit NUMERIC(12,2) NOT NULL,
  importe    NUMERIC(12,2) NOT NULL,
  iva        NUMERIC(12,2) DEFAULT 0,
  descuento  NUMERIC(12,2) DEFAULT 0
);