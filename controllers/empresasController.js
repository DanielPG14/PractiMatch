const generic = require('./genericController');
const db = require('../config/database');

const TABLE = 'empresas';
const ID = 'id_empresa';

exports.getPerfilEmpresa = async (req, res) => {
    try {
        // Validación de seguridad para la sesión
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ success: false, mensaje: "Sesión expirada" });
        }

        const id_usuario_sesion = req.session.usuario.id;

        const query = `
            SELECT 
                e.id_empresa, 
                e.nombre_empresa, 
                u.correo, 
                u.nombre AS nombre_contacto
            FROM empresas e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE u.id_usuario = ?
        `;

        const [results] = await db.query(query, [id_usuario_sesion]);

        if (results.length > 0) {
            res.json({ success: true, data: results[0] });
        } else {
            res.status(404).json({ success: false, mensaje: "Empresa no encontrada" });
        }
    } catch (err) {
        console.error('Error en getPerfilEmpresa:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updatePerfilEmpresa = async (req, res) => {
    let connection;
    try {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        }

        const id_usuario = req.session.usuario.id;
        const { nombre_empresa, rfc, correo, nombre } = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [empresaRows] = await connection.query('SELECT id_empresa FROM empresas WHERE id_usuario = ?', [id_usuario]);
        if (empresaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, mensaje: "Perfil de empresa no encontrado" });
        }

        await connection.query(
            'UPDATE empresas SET nombre_empresa = ?, rfc = ? WHERE id_usuario = ?', 
            [nombre_empresa, rfc, id_usuario]
        );

        await connection.query(
            'UPDATE usuarios SET correo = ?, nombre = ? WHERE id_usuario = ?', 
            [correo, nombre, id_usuario]
        );

        await connection.commit();
        
        req.session.usuario.correo = correo;
        req.session.usuario.nombre = nombre;

        res.json({ success: true, mensaje: "Perfil de empresa actualizado con éxito" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en updatePerfilEmpresa:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
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