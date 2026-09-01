const axios = require('axios');

const facturama = axios.create({
    baseURL: 'https://apisandbox.facturama.mx',
    auth: {
        username: process.env.PAC_USER,
        password: process.env.PAC_PASS,
    },
    timeout: 15000,
});

const SERIE = process.env.FACTURAMA_SERIE || 'A';
let folioContador = parseInt(process.env.FACTURAMA_FOLIO_INICIAL || '1', 10);

async function timbrar(datos) {
    const { emisor, receptor, conceptos, usoCFDI, metodoPago, formaPago } = datos;

    const esPublicoGeneral = receptor.rfc === 'XAXX010101000';
    const folioActual = folioContador;

    const body = {
        CfdiType: 'I',
        NameId: '1',
        ExpeditionPlace: emisor.cp,
        Serie: SERIE,
        Folio: String(folioActual),
        PaymentMethod: metodoPago,
        PaymentForm: metodoPago === 'PPD'
            ? '99'
            : ((formaPago && String(formaPago).trim()) ? String(formaPago).trim() : '99'),
        Exportation: '01',

        Receiver: {
            Rfc: receptor.rfc,
            Name: receptor.nombre,
            CfdiUse: esPublicoGeneral ? 'S01' : usoCFDI,
            FiscalRegime: esPublicoGeneral ? '616' : receptor.regimen,
            TaxZipCode: esPublicoGeneral ? emisor.cp : receptor.cp_fiscal,
        },

        ...(esPublicoGeneral && {
            GlobalInformation: {
                Periodicity: '01',
                Months: String(new Date().getMonth() + 1).padStart(2, '0'),
                Year: String(new Date().getFullYear()),
            }
        }),

        Items: conceptos.map((c) => {
            const importe = parseFloat(c.importe.toFixed(2));
            const objetoImp = c.objeto_imp || '02';
            const requiereImpuestos = objetoImp === '02';
            const iva = requiereImpuestos ? parseFloat((importe * 0.16).toFixed(2)) : 0;

            const item = {
                ProductCode: c.clave_sat,
                Description: c.descripcion,
                Unit: 'Servicio',
                UnitCode: c.clave_unidad,
                UnitPrice: parseFloat(c.valor_unit),
                Quantity: parseFloat(c.cantidad),
                Subtotal: importe,
                Total: parseFloat((importe + iva).toFixed(2)),
                TaxObject: objetoImp,
            };

            if (requiereImpuestos) {
                item.Taxes = [{
                    Total: iva,
                    Name: 'IVA',
                    Base: importe,
                    Rate: 0.16,
                    IsRetention: false,
                }];
            }

            return item;
        }),
    };

    console.log('JSON enviado a Facturama:', JSON.stringify(body, null, 2));

    try {
        const response = await facturama.post('/api/3/cfdis', body);
        console.log('Factura timbrada. UUID:', response.data.Complement?.TaxStamp?.Uuid);

        folioContador++;

        const xmlResp = await facturama.get(
            `/api/cfdi/xml/issued/${response.data.Id}`,
            { responseType: 'arraybuffer' }
        );

        const jsonResp = JSON.parse(Buffer.from(xmlResp.data).toString('utf8'));

        let xmlDecodificado;
        if (jsonResp.ContentEncoding === 'base64' && jsonResp.Content) {
            xmlDecodificado = Buffer.from(jsonResp.Content, 'base64').toString('utf8');
        } else if (jsonResp.Content) {
            xmlDecodificado = jsonResp.Content;
        } else {
            throw new Error('La respuesta de Facturama no tiene el campo "Content" esperado: ' + JSON.stringify(jsonResp));
        }

        if (!xmlDecodificado.trim().startsWith('<?xml') && !xmlDecodificado.trim().startsWith('<cfdi:Comprobante')) {
            console.warn('[pac.service] El XML decodificado no parece válido. Primeros 80 caracteres:', xmlDecodificado.slice(0, 80));
        }

        return {
            uuid: response.data.Complement?.TaxStamp?.Uuid || response.data.Id,
            xmlTimbrado: xmlDecodificado,
        };
    } catch (err) {
        console.error('Status:', err.response?.status);
        console.error('Data:', JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
}

module.exports = { timbrar };