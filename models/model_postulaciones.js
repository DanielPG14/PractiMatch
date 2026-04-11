const db = require('../config/database');

async function obtenerPostulacionesPorAlumno(id_estudiante) {
    try {
        const [rows] = await db.query(`
            SELECT p.id_postulacion, e.nombre_empresa, v.tipo_proceso, p.fecha_postulacion, p.estatus
            FROM postulaciones p
            JOIN vacantes v ON p.id_vacante = v.id_vacante
            JOIN empresas e ON v.id_empresa = e.id_empresa
            WHERE p.id_estudiante = ?
            ORDER BY p.fecha_postulacion DESC
        `, [id_estudiante]);
        return rows;
    } catch (error) {
        console.error("Error al obtener postulaciones:", error);
        throw error;
    }
}

async function crearPostulacion(id_estudiante, id_vacante) {
    try {
        const [result] = await db.query(
            "INSERT INTO postulaciones (id_estudiante, id_vacante, estatus, fecha_postulacion) VALUES (?, ?, 'En revisión', CURDATE())",
            [id_estudiante, id_vacante]
        );
        return result;
    } catch (error) {
        console.error("Error al crear postulación:", error);
        throw error;
    }
}

module.exports = { obtenerPostulacionesPorAlumno, crearPostulacion };