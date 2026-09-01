const db = require('../config/db');
const { timbrar } = require('../services/pac.service');
const { timbrarSimulado } = require('../services/simulador.service');

const RFC_PUBLICO_GENERAL = 'XAXX010101000';

const emitir = async (req, res) => {
    try {
        const { clienteId, conceptos, usoCFDI, metodoPago, formaPago } = req.body;

        const modoSolicitado = req.body.modo === 'real' ? 'real' : 'simulado';

        const emisor = (await db.query('SELECT * FROM emisor LIMIT 1')).rows[0];
        const receptor = (await db.query(
            'SELECT * FROM clientes WHERE id = $1', [clienteId]
        )).rows[0];

        if (!emisor) return res.status(400).json({ ok: false, error: 'Sin emisor configurado en la BD' });
        if (!receptor) return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });
        if (!conceptos || conceptos.length === 0)
            return res.status(400).json({ ok: false, error: 'Debe agregar al menos un concepto' });

        const esPublicoGeneral = receptor.rfc === RFC_PUBLICO_GENERAL;

        if (modoSolicitado === 'real' && !esPublicoGeneral) {
            return res.status(400).json({
                ok: false,
                error: 'Solo el cliente "Público en General" (XAXX010101000) puede timbrarse en modo real contra Facturama. Usa modo simulado para este cliente.',
            });
        }

        const modo = modoSolicitado === 'real' ? 'real' : 'simulado';

        for (const c of conceptos) {
            c.importe = parseFloat((c.cantidad * c.valor_unit).toFixed(2));
        }
        const subtotal = conceptos.reduce((a, c) => a + c.importe, 0);
        const totalIVA = conceptos.reduce((a, c) =>
            c.objeto_imp === '02' ? a + parseFloat((c.importe * 0.16).toFixed(2)) : a, 0);
        const total = parseFloat((subtotal + totalIVA).toFixed(2));
        const fecha = new Date().toISOString().slice(0, 19);

        let uuid, xmlTimbrado, serie, folio, estado;

        if (modo === 'real') {
            folio = `${Date.now()}`;
            const resultado = await timbrar({
                emisor, receptor, conceptos,
                totales: { subtotal, totalIVA, total },
                usoCFDI, metodoPago, formaPago, folio,
            });
            uuid = resultado.uuid;
            xmlTimbrado = resultado.xmlTimbrado;
            serie = process.env.FACTURAMA_SERIE || 'A';
            estado = 'timbrada';
        } else {
            const resultado = await timbrarSimulado({
                emisor, receptor, conceptos,
                totales: { subtotal, totalIVA, total },
                usoCFDI, metodoPago, formaPago,
            });
            uuid = resultado.uuid;
            xmlTimbrado = resultado.xmlTimbrado;
            serie = resultado.serie;
            folio = resultado.folio;
            estado = 'simulada';
        }

        const result = await db.query(
            `INSERT INTO facturas
         (serie, folio, fecha, emisor_id, cliente_id, uso_cfdi,
          metodo_pago, forma_pago, subtotal, total, uuid, xml_timbrado, estado, modo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
            [serie, folio, fecha, emisor.id, clienteId, usoCFDI,
                metodoPago, formaPago, subtotal, total, uuid, xmlTimbrado, estado, modo]
        );

        const facturaId = result.rows[0].id;

        for (const c of conceptos) {
            const ivaConcepto = c.objeto_imp === '02'
                ? parseFloat((c.importe * 0.16).toFixed(2))
                : 0;

            await db.query(
                `INSERT INTO factura_conceptos
             (factura_id, producto_id, cantidad, valor_unit, importe, iva, descuento,
              descripcion, clave_sat, clave_unidad, objeto_imp)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [
                    facturaId,
                    c.producto_id || null,
                    c.cantidad,
                    c.valor_unit,
                    c.importe,
                    ivaConcepto,
                    c.descuento || 0,
                    c.descripcion,
                    c.clave_sat,
                    c.clave_unidad,
                    c.objeto_imp || '02',
                ]
            );
        }

        res.status(201).json({ ok: true, facturaId, uuid, modo, estado });

    } catch (err) {
        console.error('--- ERROR AL EMITIR FACTURA ---');
        if (err.response) {
            console.error('Status HTTP:', err.response.status);
            console.error('Cuerpo de respuesta de Facturama:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error interno (no es de Facturama):', err.message);
            console.error(err.stack);
        }

        let msg = err.message;
        if (err.response?.data) {
            msg = err.response.data.Message
                || JSON.stringify(err.response.data);
        }
        res.status(500).json({ ok: false, error: msg });
    }
};

const listar = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const countR = await db.query("SELECT COUNT(*)::int AS total FROM facturas");
        const total = countR.rows[0].total;

        const r = await db.query(
            `SELECT f.*, c.nombre AS cliente_nombre
       FROM facturas f JOIN clientes c ON c.id = f.cliente_id
       ORDER BY f.creado_en DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        res.json({
            data: r.rows,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const descargarXML = async (req, res) => {
    try {
        const fac = (await db.query(
            'SELECT * FROM facturas WHERE id = $1', [req.params.id]
        )).rows[0];
        if (!fac) return res.status(404).end();
        res.setHeader('Content-Type', 'application/xml');
        const prefijo = fac.modo === 'real' ? '' : 'SIMULADA_';
        res.setHeader('Content-Disposition', `attachment; filename="${prefijo}${fac.uuid}.xml"`);
        res.send(fac.xml_timbrado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { emitir, listar, descargarXML };