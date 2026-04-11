const db = require('../config/database');

async function obtenerVacantes() {
    try {
        const [rows] = await db.query(`
            SELECT v.id_vacante, e.nombre_empresa, v.tipo_proceso, v.descripcion, v.fecha_creacion
            FROM vacantes v
            JOIN empresas e ON v.id_empresa = e.id_empresa
            ORDER BY v.fecha_creacion DESC
        `);
        return rows;
    } catch (error) {
        console.error("Error al obtener vacantes:", error);
        throw error;
    }
}

async function crearVacante(id_empresa, tipo_proceso, descripcion) {
    try {
        const [result] = await db.query(
            "INSERT INTO vacantes (id_empresa, tipo_proceso, descripcion, fecha_creacion) VALUES (?, ?, ?, CURDATE())",
            [id_empresa, tipo_proceso, descripcion]
        );
        return result;
    } catch (error) {
        console.error("Error al crear vacante:", error);
        throw error;
    }
}

module.exports = { obtenerVacantes, crearVacante };