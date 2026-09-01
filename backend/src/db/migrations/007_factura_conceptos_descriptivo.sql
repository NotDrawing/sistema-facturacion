ALTER TABLE factura_conceptos ADD COLUMN IF NOT EXISTS descripcion  VARCHAR(300);
ALTER TABLE factura_conceptos ADD COLUMN IF NOT EXISTS clave_sat    VARCHAR(8);
ALTER TABLE factura_conceptos ADD COLUMN IF NOT EXISTS clave_unidad VARCHAR(6);
ALTER TABLE factura_conceptos ADD COLUMN IF NOT EXISTS objeto_imp   VARCHAR(2) DEFAULT '02';