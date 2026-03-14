const db = require('../config/database');

async function obtenerUsuarios(correo) {
    try {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
        return rows;
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error;
    }
}

async function crearUsuario(correo, contrasena, rol) {
    try {
        const [result] = await db.query("INSERT INTO usuarios (correo, password, rol) VALUES (?, ?, ?)", [correo, contrasena, rol]);
        return result;
    } catch (error) {
        console.error("Error al crear usuario:", error);
        throw error;
    }
}

module.exports = { obtenerUsuarios, crearUsuario };