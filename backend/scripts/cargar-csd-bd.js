require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const CSD_DIR = path.join(__dirname, '../assets/csd');

async function cargarCSD() {
    const keyPem = fs.readFileSync(path.join(CSD_DIR, 'llave_privada.pem'), 'utf8');
    const certB64 = fs.readFileSync(path.join(CSD_DIR, 'certificado.pem'), 'utf8');

    await db.query(`
    UPDATE emisor SET
      rfc      = 'EKU9003173C9',
      nombre   = 'ESCUELA KEMPER URGATE',
      regimen  = '601',
      cp       = '03100',
      no_cert  = '20001000000300022323',
      cert_b64 = $1,
      key_pem  = $2
    WHERE id = 1
  `, [certB64.trim(), keyPem.trim()]);

    console.log('CSD cargado correctamente en la BD');
    console.log('RFC:     EKU9003173C9');
    console.log('NoCert:  20001000000300022323');
    process.exit(0);
}

cargarCSD().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});