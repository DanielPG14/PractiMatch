const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/postulacionesController');

// Endpoint para el AJAX que carga las postulaciones
router.get('/listar', getAll);

module.exports = router;
