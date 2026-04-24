const express = require('express');
const router = express.Router();
const { obtenerPostulaciones } = require('../controllers/postulacionesController');

// Definimos el endpoint para el Ajax
router.get('/listar', obtenerPostulaciones);

module.exports = router;