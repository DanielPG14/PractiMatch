const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const controller = require('../controllers/estudiantesController');

// MIDDLEWARE DE SEGURIDAD
const asegurarMatriculaEnSesion = async (req, res, next) => {
    if (req.session.usuario && !req.session.matricula) {
        try {
            const [rows] = await db.query('SELECT matricula, tipo_proceso FROM estudiantes WHERE id_usuario = ?', [req.session.usuario.id]);
            if (rows.length > 0) {
                req.session.matricula = rows[0].matricula;
                req.session.tipo_proceso = rows[0].tipo_proceso;
            }
        } catch (err) { 
            console.error("Error al recuperar matrícula:", err); 
            return res.status(500).json({ success: false, error: "Error al validar sesión" });
        }
    }
    next();
};

// CONFIGURACIÓN DE MULTER
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const matricula = req.session.matricula;
        if (!matricula) return cb(new Error('No se encontró la matrícula en la sesión'));
        const dir = path.join(__dirname, `../uploads/documentos_alumnos/${matricula}`);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const nombreDocSeguro = (req.body.nombreDocumento || 'documento').replace(/[^a-zA-Z0-9]/g, '');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${nombreDocSeguro}_${Date.now()}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|jpg|jpeg|png/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.test(ext)) return cb(null, true);
        cb(new Error('Formato no permitido. Solo se aceptan PDF, JPG y PNG.'));
    }
});

// ==========================================
// RUTAS EXISTENTES
// ==========================================
router.get('/perfil', controller.getPerfil);
router.put('/perfil', controller.updatePerfil);
router.post('/seleccionar-proceso', controller.seleccionarProceso);
router.get('/estado-proceso', controller.getEstatusProcesoAlumno);
router.get('/mis-documentos', controller.getMisDocumentos);
router.post('/subir-documento', asegurarMatriculaEnSesion, upload.single('archivo'), controller.subirDocumento);

// ==========================================
// NUEVAS RUTAS (PARA VACANTES Y POSTULACIONES)
// ==========================================
// Estas son las que faltaban y causaban el error 404
router.get('/vacantes', asegurarMatriculaEnSesion, controller.getVacantesDisponibles);
router.post('/postular', asegurarMatriculaEnSesion, controller.postularVacante);
router.get('/mis-postulaciones', asegurarMatriculaEnSesion, controller.getMisPostulaciones);
router.put('/responder-postulacion', asegurarMatriculaEnSesion, controller.responderPostulacion);

// MANEJO DE ERRORES DE MULTER
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message.includes('Formato no permitido')) {
        return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
});

module.exports = router;