const generic = require('./genericController');
const db = require('../config/database');

const TABLE = 'estudiantes';
const ID = 'id_estudiante';

// Obtener perfil del estudiante autenticado
exports.getPerfil = async (req, res) => {
    try {
        // 1. Validar que la sesión exista antes de pedir el ID
        if (!req.session || !req.session.usuario) {
            console.log("Sesión no encontrada");
            return res.status(401).json({
                success: false,
                mensaje: "Sesión expirada. Por favor, vuelve a loguearte."
            });
        }

        const id_usuario_sesion = req.session.usuario.id;

        // 2. Tu consulta con el JOIN (Asegúrate de que los nombres de tabla sean correctos)
        const query = `
            SELECT 
                e.id_estudiante, 
                e.matricula, 
                e.carrera, 
                e.rfc, 
                u.correo
            FROM estudiantes e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE u.id_usuario = ?
        `;

        const [results] = await db.query(query, [id_usuario_sesion]);

        if (results.length > 0) {
            res.json({ success: true, data: results[0] });
        } else {
            res.status(404).json({ success: false, mensaje: "Estudiante no encontrado." });
        }
    } catch (err) {
        console.error('Error detallado en getPerfil:', err);
        res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
};

// Actualizar perfil del estudiante (solo RFC es editable)
exports.updatePerfil = async (req, res) => {
    try {
        const id_usuario = req.session.usuario ? req.session.usuario.id : null;
        const { rfc } = req.body;

        if (!id_usuario) {
            return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        }

        const query = 'UPDATE estudiantes SET rfc = ? WHERE id_usuario = ?';
        await db.query(query, [rfc, id_usuario]);

        res.json({ success: true, mensaje: "Perfil actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

exports.create = generic.create(TABLE, [
    'id_usuario',
    'matricula',
    'carrera',
    'rfc'
]);

exports.update = generic.update(TABLE, ID, [
    'id_usuario',
    'matricula',
    'carrera',
    'rfc'
]);

exports.delete = generic.remove(TABLE, ID);
