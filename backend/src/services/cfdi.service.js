const { create } = require('xmlbuilder2');

function buildXML({ emisor, receptor, conceptos, totales,
    usoCFDI, metodoPago, formaPago, serie, folio, fecha }) {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('cfdi:Comprobante', {
            'xmlns:cfdi': 'http://www.sat.gob.mx/cfd/4',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation': 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd',
            Version: '4.0', Serie: serie, Folio: folio, Fecha: fecha,
            NoCertificado: emisor.no_cert, Certificado: emisor.cert_b64,
            SubTotal: totales.subtotal.toFixed(2),
            Total: totales.total.toFixed(2),
            Moneda: 'MXN', TipoDeComprobante: 'I',
            Exportacion: '01', MetodoPago: metodoPago,
            FormaPago: formaPago, LugarExpedicion: emisor.cp, Sello: ''
        });

    doc.ele('cfdi:Emisor', { Rfc: emisor.rfc, Nombre: emisor.nombre, RegimenFiscal: emisor.regimen }).up();
    doc.ele('cfdi:Receptor', {
        Rfc: receptor.rfc, Nombre: receptor.nombre,
        DomicilioFiscalReceptor: receptor.cp_fiscal,
        RegimenFiscalReceptor: receptor.regimen, UsoCFDI: usoCFDI
    }).up();

    const nC = doc.ele('cfdi:Conceptos');
    for (const c of conceptos) {
        const n = nC.ele('cfdi:Concepto', {
            ClaveProdServ: c.clave_sat, Cantidad: c.cantidad,
            ClaveUnidad: c.clave_unidad, Descripcion: c.descripcion,
            ValorUnitario: c.valor_unit.toFixed(2),
            Importe: c.importe.toFixed(2), ObjetoImp: c.objeto_imp || '02'
        });
        if (c.objeto_imp === '02')
            n.ele('cfdi:Impuestos').ele('cfdi:Traslados').ele('cfdi:Traslado', {
                Base: c.importe.toFixed(2), Impuesto: '002', TipoFactor: 'Tasa',
                TasaOCuota: '0.160000', Importe: (c.importe * 0.16).toFixed(2)
            });
        n.up();
    }
    doc.ele('cfdi:Impuestos', { TotalImpuestosTrasladados: totales.totalIVA.toFixed(2) })
        .ele('cfdi:Traslados').ele('cfdi:Traslado', {
            Base: totales.subtotal.toFixed(2), Impuesto: '002',
            TipoFactor: 'Tasa', TasaOCuota: '0.160000',
            Importe: totales.totalIVA.toFixed(2)
        });
    return doc.end({ prettyPrint: false });
}
module.exports = { buildXML };