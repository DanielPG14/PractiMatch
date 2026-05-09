const generic = require('./genericController');
const db = require('../config/database'); // Importamos la DB para la lógica personalizada

const TABLE = 'vacantes';
const ID = 'id_vacante';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

exports.create = async (req, res) => {
    try {
        // 1. Obtenemos el ID del usuario de la sesión (en tu caso es el 3)
        const id_usuario_sesion = req.session.usuario ? req.session.usuario.id : null;

        if (!id_usuario_sesion) {
            return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        }

        // 2. BUSCAMOS EL ID_EMPRESA REAL vinculado a este usuario
        const [empresa] = await db.query(
            'SELECT id_empresa FROM empresas WHERE id_usuario = ?', 
            [id_usuario_sesion]
        );

        if (empresa.length === 0) {
            return res.status(403).json({ 
                success: false, 
                mensaje: "Este usuario no tiene una empresa vinculada en la base de datos." 
            });
        }

        const id_empresa_real = empresa[0].id_empresa; // Aquí obtendremos el 1
        const { tipo_proceso, descripcion } = req.body;

        // 3. INSERTAMOS usando el id_empresa_real
        const query = `INSERT INTO vacantes (id_empresa, tipo_proceso, descripcion) VALUES (?, ?, ?)`;
        await db.query(query, [id_empresa_real, tipo_proceso, descripcion]);

        res.json({ success: true, mensaje: "Vacante creada exitosamente" });

    } catch (error) {
        console.error("Error detallado:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = generic.update(TABLE, ID, ['tipo_proceso', 'descripcion']);
exports.delete = generic.remove(TABLE, ID);