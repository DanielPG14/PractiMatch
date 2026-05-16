const generic = require('./genericController');
const db = require('../config/database');

const TABLE = 'estudiantes';
const ID = 'id_estudiante';

// Obtener perfil del estudiante autenticado
exports.getPerfil = async (req, res) => {
    try {
        if (!req.session || !req.session.usuario || !req.session.usuario.id) {
            console.log("Sesión no encontrada o inválida en getPerfil");
            return res.status(401).json({
                success: false,
                mensaje: "Sesión expirada. Por favor, vuelve a loguearte."
            });
        }

        const id_usuario_sesion = req.session.usuario.id;

        const query = `
            SELECT 
                e.id_estudiante,
                e.matricula,
                e.carrera,
                e.rfc,
                u.correo,
                u.nombre
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

exports.updatePerfil = async (req, res) => {
    let connection;
    try {
        const id_usuario = req.session && req.session.usuario ? req.session.usuario.id : null;
        const { rfc, correo, nombre } = req.body;

        if (!id_usuario) {
            return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        }

        if (rfc === undefined && correo === undefined && nombre === undefined) {
            return res.status(400).json({ success: false, mensaje: "No se proporcionó ningún campo para actualizar." });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        if (rfc !== undefined) {
            await connection.query('UPDATE estudiantes SET rfc = ? WHERE id_usuario = ?', [rfc, id_usuario]);
        }

        if (correo !== undefined || nombre !== undefined) {
            const updates = [];
            const params = [];
            if (correo !== undefined) {
                updates.push('correo = ?');
                params.push(correo);
            }
            if (nombre !== undefined) {
                updates.push('nombre = ?');
                params.push(nombre);
            }
            params.push(id_usuario);

            await connection.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`, params);
        }

        await connection.commit();
        res.json({ success: true, mensaje: "Perfil actualizado correctamente" });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
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
