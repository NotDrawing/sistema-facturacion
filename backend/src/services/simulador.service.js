const crypto = require('crypto');
const { create } = require('xmlbuilder2');
const { buildXML } = require('./cfdi.service');
const { firmarCFDI } = require('./firma.service');

const SERIE_SIMULADA = process.env.FACTURAMA_SERIE_SIMULADA || 'SIM';
let folioSimulado = 1;

function agregarTimbreSimulado(xmlFirmado, selloCfdi) {
    const uuidSimulado = crypto.randomUUID();
    const fechaTimbrado = new Date().toISOString().slice(0, 19);

    const doc = create(xmlFirmado);
    const root = doc.root();

    root.ele('cfdi:Complemento').ele('tfd:TimbreFiscalDigital', {
        'xmlns:tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
        Version: '1.1',
        UUID: uuidSimulado,
        FechaTimbrado: fechaTimbrado,
        RfcProvCertif: 'SIMULADO',
        SelloCFD: (selloCfdi || '').slice(0, 40) || 'SIMULADO',
        NoCertificadoSAT: '00000000000000000000',
        SelloSAT: 'SELLO_SAT_SIMULADO_NO_VALIDO_ANTE_EL_SAT',
    }).up().up();

    return { xml: doc.end({ prettyPrint: false }), uuid: uuidSimulado };
}

async function timbrarSimulado(datos) {
    const { emisor, receptor, conceptos, totales, usoCFDI, metodoPago, formaPago } = datos;

    const folio = String(folioSimulado++);
    const fecha = new Date().toISOString().slice(0, 19);

    const xmlSinSello = buildXML({
        emisor, receptor, conceptos, totales,
        usoCFDI, metodoPago, formaPago,
        serie: SERIE_SIMULADA, folio, fecha,
    });

    let xmlFirmado = xmlSinSello;
    let sello = '';
    try {
        if (emisor.key_pem) {
            xmlFirmado = await firmarCFDI(xmlSinSello, emisor.key_pem);
            const m = xmlFirmado.match(/Sello="([^"]*)"/);
            sello = m ? m[1] : '';
        }
    } catch (err) {
        console.warn('[simulador] No se pudo firmar el XML (se continúa sin sello real):', err.message);
    }

    const { xml, uuid } = agregarTimbreSimulado(xmlFirmado, sello);

    return { uuid, xmlTimbrado: xml, folio, serie: SERIE_SIMULADA };
}

module.exports = { timbrarSimulado };
