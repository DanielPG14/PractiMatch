const db = require('../config/database');

exports.getAll = async (req, res) => {
    const query = `
        SELECT
            postulaciones.id_postulacion AS folio, -- Alias para 'folio'
            postulaciones.estatus AS estado,      -- Alias para 'estado'
            estudiantes.matricula,
            usuarios.correo,
            vacantes.titulo AS tipo                -- Alias para 'tipo' (o vacante)
        FROM postulaciones
        INNER JOIN estudiantes ON postulaciones.id_estudiante = estudiantes.id_estudiante
        INNER JOIN usuarios ON estudiantes.id_usuario = usuarios.id_usuario
        INNER JOIN vacantes ON postulaciones.id_vacante = vacantes.id_vacante
    `;

    try {
        const [results] = await db.query(query);
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error en getAll postulaciones:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
