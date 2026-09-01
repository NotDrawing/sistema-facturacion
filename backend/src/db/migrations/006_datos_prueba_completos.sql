INSERT INTO clientes (rfc, nombre, cp_fiscal, regimen, email) VALUES
  ('XEXX010101000', 'CLIENTE EXTRANJERO DE PRUEBA', '64000', '616', 'extranjero@ejemplo.com'),
  ('COSC8001137NA', 'MARIA DEL CARMEN OCHOA SOLIS', '64000', '605', 'carmen.ochoa@ejemplo.com'),
  ('JUMA8001137N1', 'JUAN MANUEL PEREZ TORRES', '64000', '612', 'juan.perez@ejemplo.com'),
  ('TCM970625PI6',  'TECNOLOGIAS CREATIVAS DEL MAYAB SA DE CV', '97203', '601', 'facturacion@tcm-ejemplo.com.mx'),
  ('IDS091218HU8',  'INNOVACION DIGITAL DEL SURESTE SC', '97000', '612', 'admin@ids-ejemplo.com.mx')
ON CONFLICT DO NOTHING;

INSERT INTO productos (descripcion, clave_sat, clave_unidad, precio, objeto_imp) VALUES
  ('Renta de equipo de cómputo',        '81112501', 'E48', 2500.00, '02'),
  ('Soporte técnico mensual',           '81112501', 'E48', 1800.00, '02'),
  ('Diseño de página web',              '81112101', 'E48', 7500.00, '02'),
  ('Hospedaje web anual',               '81112501', 'E48', 1200.00, '02'),
  ('Licencia de software anual',        '43232300', 'E48', 3600.00, '02'),
  ('Capacitación empresarial (4 hrs)',  '86131500', 'HUR', 2000.00, '02'),
  ('Venta de libro técnico',            '55101500', 'H87', 450.00,  '01'),
  ('Servicio médico de consulta',       '85121800', 'E48', 800.00,  '01')
ON CONFLICT DO NOTHING;
