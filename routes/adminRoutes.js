const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { verificarSesion, verificarRol } = require('../middlewares/auth');

// Middleware de seguridad
router.use(verificarSesion);
router.use(verificarRol('Admin'));

// --- RUTAS DE USUARIOS Y DASHBOARD ---
router.get('/dashboard', controller.getDashboard);
router.get('/usuarios', controller.getAllUsers);

// --- RUTAS DE EMPRESAS ---
router.get('/empresas', controller.getEmpresas);
router.put('/empresas/estatus', controller.updateEstatusEmpresa);

// --- RUTAS DE VACANTES ---
router.get('/vacantes', controller.getVacantesRevision);
router.put('/vacantes/estatus', controller.updateEstatusVacante);

// --- RUTAS DE DOCUMENTOS ---
router.get('/documentos', controller.getDocumentosAlumnos);
router.put('/documentos/estado', controller.updateDocumentoEstado);

module.exports = router;