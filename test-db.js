const db = require('./config/database');

async function probarQuery() {
    try {
        console.log("--- Iniciando prueba de conexión ---");
        const [rows] = await db.query('SELECT * FROM usuarios');

        if (rows.length > 0) {
            console.log("CONEXIÓN EXITOSA");
            console.log("Datos encontrados:", rows);
        } else {
            console.log("CONEXIÓN OK, pero la tabla está vacía.");
        }
    } catch (error) {
        console.error("ERROR DE BASE DE DATOS:");
        console.error(error.message);
    } finally {
        process.exit();
    }
}

probarQuery();