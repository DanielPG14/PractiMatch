const db = require('../config/database');

// GET ALL
exports.getAll = (table) => (req, res) => {
    db.query(`SELECT * FROM ${table}`, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });

        res.json({ success: true, data: results });
    });
};

// GET BY ID
exports.getById = (table, idField) => (req, res) => {
    db.query(
        `SELECT * FROM ${table} WHERE ${idField} = ?`,
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });

            res.json({ success: true, data: results[0] });
        }
    );
};

// CREATE
exports.create = (table, fields) => (req, res) => {
    const values = fields.map(f => req.body[f]);

    db.query(
        `INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
        values,
        (err) => {
            if (err) return res.status(500).json({ success: false, error: err });

            res.json({ success: true, message: "Creado" });
        }
    );
};

// UPDATE
exports.update = (table, idField, fields) => (req, res) => {
    const values = fields.map(f => req.body[f]);

    db.query(
        `UPDATE ${table} SET ${fields.map(f => `${f}=?`).join(',')} WHERE ${idField}=?`,
        [...values, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ success: false });

            res.json({ success: true, message: "Actualizado" });
        }
    );
};

// DELETE
exports.remove = (table, idField) => (req, res) => {
    db.query(
        `DELETE FROM ${table} WHERE ${idField}=?`,
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ success: false });

            res.json({ success: true, message: "Eliminado" });
        }
    );
};
