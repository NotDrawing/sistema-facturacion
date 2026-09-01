const db = require("../config/db");

function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

const listar = async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const countR = await db.query("SELECT COUNT(*)::int AS total FROM clientes");
        const total = countR.rows[0].total;
        const result = await db.query(
            "SELECT * FROM clientes ORDER BY nombre ASC LIMIT $1 OFFSET $2",
            [limit, offset]
        );
        res.json({
            data: result.rows,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const obtener = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM clientes WHERE id=$1", [
            req.params.id,
        ]);
        if (!result.rows[0])
            return res.status(404).json({ error: "Cliente no encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const crear = async (req, res) => {
    try {
        const { rfc, nombre, cp_fiscal, regimen, email } = req.body;
        if (!rfc || !nombre || !cp_fiscal || !regimen)
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        if (rfc.length < 12 || rfc.length > 13)
            return res.status(400).json({ error: "RFC invalido" });
        const result = await db.query(
            `INSERT INTO clientes (rfc,nombre,cp_fiscal,regimen,email)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [rfc.toUpperCase(), nombre.toUpperCase(), cp_fiscal, regimen, email || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const actualizar = async (req, res) => {
    try {
        const { rfc, nombre, cp_fiscal, regimen, email } = req.body;
        if (!rfc || !nombre || !cp_fiscal || !regimen)
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        if (rfc.length < 12 || rfc.length > 13)
            return res.status(400).json({ error: "RFC invalido" });
        const result = await db.query(
            `UPDATE clientes SET rfc=$1, nombre=$2, cp_fiscal=$3, regimen=$4, email=$5
       WHERE id=$6 RETURNING *`,
            [
                rfc.toUpperCase(),
                nombre.toUpperCase(),
                cp_fiscal,
                regimen,
                email || null,
                req.params.id,
            ]
        );
        if (!result.rows[0])
            return res.status(404).json({ error: "Cliente no encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const eliminar = async (req, res) => {
    try {
        const result = await db.query(
            "DELETE FROM clientes WHERE id=$1 RETURNING id",
            [req.params.id]
        );
        if (!result.rows[0])
            return res.status(404).json({ error: "Cliente no encontrado" });
        res.json({ message: "Cliente eliminado" });
    } catch (err) {
        if (err.code === "23503") {
            return res.status(400).json({
                error:
                    "No se puede eliminar: el cliente tiene facturas asociadas. Elimina o cancela esas facturas primero.",
            });
        }
        res.status(500).json({ error: err.message });
    }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };