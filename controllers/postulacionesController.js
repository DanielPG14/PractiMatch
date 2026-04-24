const { listarTodos } = require('../models/model_consultas');

const obtenerPostulaciones = async (req, res) => {
    try {
        // Usamos tu función dinámica 'listarTodos'
        const datos = await listarTodos('postulaciones');
        res.json(datos);
    } catch (error) {
        console.error("Error en el controlador:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { obtenerPostulaciones };