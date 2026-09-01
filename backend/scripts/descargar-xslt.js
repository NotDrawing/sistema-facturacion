const http = require('http');
const fs = require('fs');
const path = require('path');

const URL = 'http://www.sat.gob.mx/sitio_internet/cfd/4/cadenaoriginal_4_0/cadenaoriginal_4_0.xslt';
const DEST = path.join(__dirname, '../assets/cadenaoriginal_4_0.xslt');

http.get(URL, res => {
    const file = fs.createWriteStream(DEST);
    res.pipe(file);
    file.on('finish', () => console.log('XSLT guardado en assets/'));
});