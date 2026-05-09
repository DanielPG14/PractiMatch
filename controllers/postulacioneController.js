const generic = require('./genericController');
const db = require('../config/database'); // Importamos la conexión a la base de datos

const TABLE = 'postulaciones';
const ID = 'id_postulacion';

// Sobrescribimos el getAll con un JOIN para traer datos de alumnos y vacantes
exports.getAll = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id_postulacion,
                e.matricula,
                u.correo,
                v.tipo_proceso as vacante_titulo,
                p.fecha_postulacion,
                p.estatus
            FROM postulaciones p
            JOIN estudiantes e ON p.id_estudiante = e.id_estudiante
            JOIN usuarios u ON e.id_usuario = u.id_usuario
            JOIN vacantes v ON p.id_vacante = v.id_vacante
        `;
        const [rows] = await db.query(query);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getAll postulaciones:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getOne = generic.getById(TABLE, ID);

exports.create = generic.create(TABLE, [
    'id_estudiante',
    'id_vacante'
]);

exports.update = generic.update(TABLE, ID, [
    'id_estudiante',
    'id_vacante',
    'estatus',
    'fecha_postulacion'
]);

exports.delete = generic.remove(TABLE, ID);