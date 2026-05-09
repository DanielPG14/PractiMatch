const db = require('../config/database');

exports.getDashboard = async (req, res) => {
    const query = `
        SELECT
            usuarios.correo,
            vacantes.titulo AS vacante_titulo,
            postulaciones.estatus
        FROM postulaciones
        INNER JOIN estudiantes
            ON postulaciones.id_estudiante = estudiantes.id_estudiante
        INNER JOIN usuarios
            ON estudiantes.id_usuario = usuarios.id_usuario
        INNER JOIN vacantes
            ON postulaciones.id_vacante = vacantes.id_vacante
    `;

    try {
        const [results] = await db.query(query);
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error en getDashboard:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
