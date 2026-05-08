const db = require('../config/database');

exports.getDashboard = (req, res) => {

    const query = `

        SELECT

            usuarios.correo,
            vacantes.tipo_proceso,
            postulaciones.estatus

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
