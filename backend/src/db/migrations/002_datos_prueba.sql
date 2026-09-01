INSERT INTO emisor (rfc, nombre, regimen, cp)
VALUES ('EKU9003173C9', 'ESCUELA KEMPER URGATE', '601', '26015');

INSERT INTO clientes (rfc, nombre, cp_fiscal, regimen, email) VALUES
  ('XAXX010101000', 'PUBLICO EN GENERAL',    '64000', '616', NULL),
  ('CACX7605101P8', 'CLIENTE EJEMPLO SA DE CV', '64000', '601', 'cliente@ejemplo.com');

INSERT INTO productos (descripcion, clave_sat, clave_unidad, precio) VALUES
  ('Servicio de consultoría', '80141600', 'E48', 1000.00),
  ('Desarrollo de software',  '43232408', 'E48', 5000.00),
  ('Equipo de cómputo',       '43211507', 'H87', 15000.00);