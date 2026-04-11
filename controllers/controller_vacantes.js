const { obtenerVacantes, crearVacante } = require('../models/model_vacantes');
const { crearPostulacion } = require('../models/model_postulaciones');

async function listarVacantes(req, res) {
    try {
        const vacantes = await obtenerVacantes();
        res.json(vacantes);
    } catch (error) {
        console.error("Error al listar vacantes:", error);
        res.status(500).json({ mensaje: "Error al obtener vacantes" });
    }
}

async function nuevaVacante(req, res) {
    const { tipo_proceso, descripcion } = req.body;
    const id_usuario = req.session.usuario?.id;
    try {
        // Obtener id_empresa del usuario logueado
        const db = require('../config/database');
        const [rows] = await db.query("SELECT id_empresa FROM empresas WHERE id_usuario = ?", [id_usuario]);
        if (rows.length === 0) return res.status(403).json({ mensaje: "No eres una empresa" });
        const id_empresa = rows[0].id_empresa;
        const result = await crearVacante(id_empresa, tipo_proceso, descripcion);
        res.status(201).json({ mensaje: "Vacante creada", id: result.insertId });
    } catch (error) {
        console.error("Error al crear vacante:", error);
        res.status(500).json({ mensaje: "Error al crear vacante" });
    }
}

async function postularse(req, res) {
    const { id_vacante } = req.body;
    const id_usuario = req.session.usuario?.id;
    try {
        const db = require('../config/database');
        const [rows] = await db.query("SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?", [id_usuario]);
        if (rows.length === 0) return res.status(403).json({ mensaje: "No eres un estudiante" });
        const id_estudiante = rows[0].id_estudiante;
        const result = await crearPostulacion(id_estudiante, id_vacante);
        res.status(201).json({ mensaje: "Postulación enviada", id: result.insertId });
    } catch (error) {
        console.error("Error al postularse:", error);
        res.status(500).json({ mensaje: "Error al postularse" });
    }
}

module.exports = { listarVacantes, nuevaVacante, postularse };