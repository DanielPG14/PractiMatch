const db = require('../config/database');

async function obtenerEmpresas() {
    try {
        const [rows] = await db.query(`
            SELECT e.id_empresa, e.nombre_empresa, e.rfc, e.estado
            FROM empresas e
            ORDER BY e.nombre_empresa ASC
        `);
        return rows;
    } catch (error) {
        console.error("Error al obtener empresas:", error);
        throw error;
    }
}

async function actualizarEstadoEmpresa(id_empresa, estado) {
    try {
        const [result] = await db.query(
            "UPDATE empresas SET estado = ? WHERE id_empresa = ?",
            [estado, id_empresa]
        );
        return result;
    } catch (error) {
        console.error("Error al actualizar empresa:", error);
        throw error;
    }
}

module.exports = { obtenerEmpresas, actualizarEstadoEmpresa };