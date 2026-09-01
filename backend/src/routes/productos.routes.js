const router = require("express").Router();
const ctrl = require("../controllers/productos.controller");

router.get("/", ctrl.listar);
router.post("/", ctrl.crear);
router.put("/:id", ctrl.actualizar);
router.delete("/:id", ctrl.eliminar);

module.exports = router;