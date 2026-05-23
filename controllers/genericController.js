const db = require('../config/database');

// GET ALL
exports.getAll = (table) => async (req, res) => {
    try {
        // En promesas usamos destructuración [rows]
        const [results] = await db.query(`SELECT * FROM ${table}`);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error(`Error en getAll (${table}):`, err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET BY ID
exports.getById = (table, idField) => async (req, res) => {
    try {
        const [results] = await db.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [req.params.id]);
        res.json({ success: true, data: results[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// CREATE
exports.create = (table, fields) => async (req, res) => {
    try {
        const values = fields.map(f => req.body[f]);
        const placeholders = fields.map(() => '?').join(',');
        
        await db.query(
            `INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders})`,
            values
        );
        res.json({ success: true, message: "Creado exitosamente" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// UPDATE
exports.update = (table, idField, fields) => async (req, res) => {
    try {
        // Filtramos solo los campos autorizados que SÍ vienen presentes en el body
        const camposPresentes = fields.filter(f => req.body[f] !== undefined);

        if (camposPresentes.length === 0) {
            return res.status(400).json({ success: false, mensaje: "No se proporcionaron campos válidos para actualizar." });
        }

        const values = camposPresentes.map(f => req.body[f]);
        const setClause = camposPresentes.map(f => `${f}=?`).join(',');
        
        await db.query(
            `UPDATE ${table} SET ${setClause} WHERE ${idField}=?`,
            [...values, req.params.id]
        );
        res.json({ success: true, message: "Actualizado exitosamente" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// DELETE
exports.remove = (table, idField) => async (req, res) => {
    try {
        await db.query(`DELETE FROM ${table} WHERE ${idField}=?`, [req.params.id]);
        res.json({ success: true, message: "Eliminado exitosamente" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};