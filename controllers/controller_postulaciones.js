const { obtenerPostulacionesPorAlumno } = require('../models/model_postulaciones');

async function listarPostulaciones(req, res) {
    const id_usuario = req.session.usuario?.id;
    try {
        const db = require('../config/database');
        const [rows] = await db.query("SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?", [id_usuario]);
        if (rows.length === 0) return res.status(403).json({ mensaje: "No eres un estudiante" });
        const id_estudiante = rows[0].id_estudiante;
        const postulaciones = await obtenerPostulacionesPorAlumno(id_estudiante);
        res.json(postulaciones);
    } catch (error) {
        console.error("Error al listar postulaciones:", error);
        res.status(500).json({ mensaje: "Error al obtener postulaciones" });
    }
}

module.exports = { listarPostulaciones };