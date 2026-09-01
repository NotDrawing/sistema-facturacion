UPDATE clientes SET
  rfc       = 'CACX7605101P8',
  nombre    = 'CARLOS COLIN XOCHIPA',
  cp_fiscal = '64000',
  regimen   = '612',
  email     = 'cliente@ejemplo.com'
WHERE rfc IN ('LAN7008173R5', 'CACX7605101P8');

INSERT INTO clientes (rfc, nombre, cp_fiscal, regimen, email)
SELECT 'EWE1709045U0', 'EXPANSION WEB', '64000', '601', 'contacto@expansionweb.com.mx'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE rfc = 'EWE1709045U0');

SELECT id, rfc, nombre, cp_fiscal, regimen FROM clientes;