ALTER TABLE facturas ADD COLUMN IF NOT EXISTS modo VARCHAR(10) NOT NULL DEFAULT 'simulado';

ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_modo_check;
ALTER TABLE facturas ADD CONSTRAINT facturas_modo_check CHECK (modo IN ('simulado', 'real'));

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS permite_timbrado_real BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE clientes SET permite_timbrado_real = TRUE WHERE rfc = 'XAXX010101000';

CREATE INDEX IF NOT EXISTS idx_facturas_modo ON facturas(modo);
