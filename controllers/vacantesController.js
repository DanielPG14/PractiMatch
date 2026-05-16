const generic = require('./genericController');
const db = require('../config/database'); // Importamos la DB para la lógica personalizada

const TABLE = 'vacantes';
const ID = 'id_vacante';

exports.getAll = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id_vacante,
                v.id_empresa,
                v.titulo,
                v.tipo_proceso,
                v.descripcion,
                v.requisitos,
                v.estado,
                v.fecha_creacion,
                e.nombre_empresa
            FROM vacantes v
            LEFT JOIN empresas e ON v.id_empresa = e.id_empresa
            WHERE v.estado = 'Aprobado'
            ORDER BY v.fecha_creacion DESC
        `;

        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error en getAll vacantes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getOne = generic.getById(TABLE, ID);
exports.update = generic.update(TABLE, ID, ['titulo', 'tipo_proceso', 'descripcion', 'requisitos', 'estado']);
exports.delete = generic.remove(TABLE, ID);

exports.create = async (req, res) => {
    try {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ success: false, mensaje: "No hay sesión activa" });
        }

        const id_usuario = req.session.usuario.id;
        const { tipo_proceso, descripcion, titulo } = req.body;

        // 1. Buscar el id_empresa real asociado a este id_usuario logueado
        const [empresa] = await db.query('SELECT id_empresa FROM empresas WHERE id_usuario = ?', [id_usuario]);

        if (empresa.length === 0) {
            return res.status(404).json({ success: false, mensaje: "No se encontró una empresa asociada a este usuario" });
        }

        const id_empresa = empresa[0].id_empresa;
        
        // Generar un título automático si viene vacío
        const tituloVacante = titulo || `Vacante para ${tipo_proceso}`;

        // 2. Insertar la vacante con estado 'Pendiente' por defecto
        const queryInsert = `
            INSERT INTO vacantes (id_empresa, titulo, tipo_proceso, descripcion, estado, fecha_creacion) 
            VALUES (?, ?, ?, ?, 'Pendiente', NOW())
        `;

        await db.query(queryInsert, [id_empresa, tituloVacante, tipo_proceso, descripcion]);

        res.json({ success: true, mensaje: "Vacante creada exitosamente y en espera de aprobación" });
    } catch (error) {
        console.error("Error al crear vacante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};