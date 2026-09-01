const { XmlParser, Xslt } = require('xslt-processor');
const fs = require('fs');
const path = require('path');

const XSLT_PATH = path.resolve(__dirname, '../../assets/cadenaoriginal_4_0.xslt');

if (!fs.existsSync(XSLT_PATH)) {
    console.error('XSLT no encontrado en:', XSLT_PATH);
    console.error('Corre primero: node scripts/descargar-xslt.js');
}

const xsltStr = fs.existsSync(XSLT_PATH)
    ? fs.readFileSync(XSLT_PATH, 'utf8')
    : null;

async function getCadenaOriginal(xmlString) {
    if (!xsltStr) {
        throw new Error(
            'XSLT del SAT no disponible. Corre: node scripts/descargar-xslt.js'
        );
    }

    const parser = new XmlParser();
    const xmlDoc = parser.xmlParse(xmlString);
    const xsltDoc = parser.xmlParse(xsltStr);

    const cadena = await new Xslt().xsltProcess(xmlDoc, xsltDoc);

    if (!cadena || cadena.trim() === '') {
        throw new Error(
            'La cadena original resultó vacía. ' +
            'Verifica que el XML tiene todos los campos obligatorios del CFDI 4.0.'
        );
    }

    return cadena.trim();
}

module.exports = { getCadenaOriginal };