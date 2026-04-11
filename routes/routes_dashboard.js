const express = require('express');
const router = express.Router();
const { listarVacantes, nuevaVacante, postularse } = require('../controllers/controller_vacantes');
const { listarPostulaciones } = require('../controllers/controller_postulaciones');
const { listarEmpresas, aprobarRechazarEmpresa } = require('../controllers/controller_empresas');

// --- Vacantes ---
router.get('/vacantes', listarVacantes);           // Obtener todas las vacantes
router.post('/vacantes', nuevaVacante);            // Crear vacante (empresa)
router.post('/vacantes/postular', postularse);     // Postularse a vacante (alumno)

// --- Postulaciones ---
router.get('/postulaciones', listarPostulaciones); // Ver mis postulaciones (alumno)

// --- Empresas ---
router.get('/empresas', listarEmpresas);                        // Listar empresas (admin)
router.put('/empresas/estado', aprobarRechazarEmpresa);         // Aprobar/rechazar empresa (admin)

module.exports = router;