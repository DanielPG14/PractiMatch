const generic = require('./genericController');
const db = require('../config/database');

const TABLE = 'empresas';
const ID = 'id_empresa';

exports.getPerfil = async (req, res) => {
    try {
        const id_usuario = req.session.usuario ? req.session.usuario.id : null;

        if (!id_usuario) {
            return res.status(401).json({ success: false, mensaje: "No hay sesión activa" });
        }

        const query = 'SELECT id_empresa, id_usuario, nombre_empresa, estado, rfc FROM empresas WHERE id_usuario = ?';
        const [rows] = await db.query(query, [id_usuario]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: "Perfil de empresa no encontrado" });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updatePerfil = async (req, res) => {
    try {
        const id_usuario = req.session.usuario ? req.session.usuario.id : null;
        const { nombre_empresa, rfc } = req.body;

        if (!id_usuario) {
            return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        }

        const query = 'UPDATE empresas SET nombre_empresa = ?, rfc = ? WHERE id_usuario = ?';
        await db.query(query, [nombre_empresa, rfc, id_usuario]);

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
    'nombre_empresa',
    'estado',
    'rfc'
]);

exports.update = generic.update(TABLE, ID, [
    'id_usuario',
    'nombre_empresa',
    'estado',
    'rfc'
]);

exports.delete = generic.remove(TABLE, ID);