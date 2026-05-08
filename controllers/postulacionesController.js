const db = require('../config/database');

exports.getAll = (req, res) => {

    const query = `
    
        SELECT
        
            postulaciones.id_postulacion,
            postulaciones.estatus,

            estudiantes.id_estudiante,
            estudiantes.matricula,

            usuarios.correo,

            vacantes.tipo_proceso

        FROM postulaciones

        INNER JOIN estudiantes
            ON postulaciones.id_estudiante = estudiantes.id_estudiante

        INNER JOIN usuarios
            ON estudiantes.id_usuario = usuarios.id_usuario

        INNER JOIN vacantes
            ON postulaciones.id_vacante = vacantes.id_vacante
    `;

    db.query(query, (err, results) => {

        if (err) {

            return res.status(500).json({
                success: false,
                error: err
            });

        }

        res.json({
            success: true,
            data: results
        });

    });

};
