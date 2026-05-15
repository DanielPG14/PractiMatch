const express = require('express');
const router = express.Router();
const controller = require('../controllers/estudiantesController');

// Rutas de perfil del estudiante autenticado
router.get('/perfil', controller.getPerfil);
router.put('/perfil', controller.updatePerfil);

// Rutas estándar
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
