const express = require('express');
const router = express.Router();
const controller = require('../controllers/empresasController');
const { verificarSesion, verificarRol } = require('../middlewares/auth');

// Middleware de protección global para todas las rutas de este archivo
// Solo permite el acceso si el usuario inició sesión y tiene el rol 'Empresa'
router.use(verificarSesion);
router.use(verificarRol('Empresa'));

// ==========================================
// RUTAS DE PERFIL
// ==========================================
// Obtener datos actuales de la empresa
router.get('/perfil', controller.getPerfilEmpresa);

// Actualizar información de la empresa (RFC, contacto, etc.)
router.put('/perfil', controller.updatePerfilEmpresa);


// ==========================================
// RUTAS DE VACANTES
// ==========================================
// Listar vacantes publicadas por la empresa logueada
router.get('/vacantes', controller.getEmpresaVacantes);

// Crear una nueva oferta de vacante
router.post('/vacantes', controller.createEmpresaVacante);


// ==========================================
// RUTAS DE POSTULACIONES Y BECARIOS
// ==========================================
// Ver todos los alumnos que se han postulado a las vacantes de la empresa
router.get('/postulaciones', controller.getEmpresaPostulaciones);

// Aceptar o rechazar una postulación (Cambia el estatus)
router.put('/responder-postulacion', controller.responderPostulacion);

// Listar becarios (Alumnos cuya postulación fue 'Aceptado')
// Esta es la ruta que alimenta la tabla de "Becarios" con matrícula y carrera
router.get('/becarios', controller.getEmpresaBecarios);


module.exports = router;