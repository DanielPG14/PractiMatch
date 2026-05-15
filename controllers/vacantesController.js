const generic = require('./genericController');
const db = require('../config/database');

const TABLE = 'vacantes';
const ID = 'id_vacante';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);
exports.update = generic.update(TABLE, ID, ['titulo', 'tipo_proceso', 'descripcion', 'requisitos', 'estado']);
exports.delete = generic.remove(TABLE, ID);

exports.create = async (req, res) => {
    try {
        const id_usuario_sesion = req.session.usuario ? req.session.usuario.id : null;
        
        if (!id_usuario_sesion) {
            return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        }

        // Buscamos el id_empresa real vinculado al usuario
        const [empresa] = await db.query('SELECT id_empresa FROM empresas WHERE id_usuario = ?', [id_usuario_sesion]);
        
        if (empresa.length === 0) {
            return res.status(403).json({ success: false, mensaje: "Perfil de empresa no encontrado" });
        }

        const id_empresa_real = empresa[0].id_empresa;

        // Extraemos los campos exactos de tu nueva DB
        const { titulo, tipo_proceso, descripcion, requisitos } = req.body;

        // El 'estado' se inserta como 'Pendiente' por defecto
        // La 'fecha_creacion' se genera con NOW()
        const query = `
            INSERT INTO vacantes 
            (id_empresa, titulo, tipo_proceso, descripcion, requisitos, estado, fecha_creacion) 
            VALUES (?, ?, ?, ?, ?, 'Pendiente', NOW())`;
        
        await db.query(query, [id_empresa_real, titulo, tipo_proceso, descripcion, requisitos]);

        res.json({ success: true, mensaje: "Vacante creada y enviada a revisión con éxito" });

    } catch (error) {
        console.error("Error al insertar vacante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};