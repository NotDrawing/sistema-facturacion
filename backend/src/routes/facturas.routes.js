const router = require("express").Router();
const ctrl = require("../controllers/facturas.controller");

router.post("/", ctrl.emitir);
router.get("/", ctrl.listar);
router.get("/:id/xml", ctrl.descargarXML);

module.exports = router;