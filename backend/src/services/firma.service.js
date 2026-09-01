const forge = require('node-forge');
const { getCadenaOriginal } = require('./cadena.service');

async function firmarCFDI(xmlSinSello, keyPem) {
    const cadena = await getCadenaOriginal(xmlSinSello);
    const md = forge.md.sha256.create();
    md.update(cadena, 'utf8');
    const llave = forge.pki.privateKeyFromPem(keyPem);
    const selloB64 = forge.util.encode64(llave.sign(md));
    return xmlSinSello.replace(/Sello=""/, `Sello="${selloB64}"`);
}
module.exports = { firmarCFDI };