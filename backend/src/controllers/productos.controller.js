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
        const countR = await db.query(
            "SELECT COUNT(*)::int AS total FROM productos WHERE activo = TRUE"
        );
        const total = countR.rows[0].total;
        const r = await db.query(
            "SELECT * FROM productos WHERE activo = TRUE ORDER BY descripcion ASC LIMIT $1 OFFSET $2",
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

const crear = async (req, res) => {
    try {
        const { descripcion, clave_sat, clave_unidad, precio, objeto_imp } = req.body;
        if (!descripcion || !clave_sat || !precio)
            return res
                .status(400)
                .json({ error: "Descripción, clave SAT y precio son obligatorios" });
        const r = await db.query(
            `INSERT INTO productos (descripcion, clave_sat, clave_unidad, precio, objeto_imp)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [descripcion, clave_sat, clave_unidad || "E48", precio, objeto_imp || "02"]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const actualizar = async (req, res) => {
    try {
        const { descripcion, clave_sat, clave_unidad, precio, objeto_imp } = req.body;
        if (
            !descripcion ||
            !clave_sat ||
            precio === undefined ||
            precio === null ||
            precio === ""
        )
            return res
                .status(400)
                .json({ error: "Descripción, clave SAT y precio son obligatorios" });
        const r = await db.query(
            `UPDATE productos SET descripcion=$1, clave_sat=$2, clave_unidad=$3,
       precio=$4, objeto_imp=$5 WHERE id=$6 AND activo = TRUE RETURNING *`,
            [
                descripcion,
                clave_sat,
                clave_unidad || "E48",
                precio,
                objeto_imp || "02",
                req.params.id,
            ]
        );
        if (!r.rows[0])
            return res.status(404).json({ error: "Producto no encontrado" });
        res.json(r.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const eliminar = async (req, res) => {
    try {
        const r = await db.query(
            "UPDATE productos SET activo=FALSE WHERE id=$1 AND activo=TRUE RETURNING id",
            [req.params.id]
        );
        if (!r.rows[0])
            return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ message: "Producto eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { listar, crear, actualizar, eliminar };