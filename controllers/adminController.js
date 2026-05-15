const db = require('../config/database');

exports.getDashboard = async (req, res) => {
    const query = `
        SELECT
            usuarios.correo,
            vacantes.titulo AS vacante_titulo,
            postulaciones.estatus
        FROM postulaciones
        INNER JOIN estudiantes
            ON postulaciones.id_estudiante = estudiantes.id_estudiante
        INNER JOIN usuarios
            ON estudiantes.id_usuario = usuarios.id_usuario
        INNER JOIN vacantes
            ON postulaciones.id_vacante = vacantes.id_vacante
    `;

    try {
        const [results] = await db.query(query);
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error en getDashboard:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
exports.getAllUsers = async (req, res) => {
    try {
        // Agregamos 'nombre' a la consulta
        const [results] = await db.query("SELECT id_usuario, correo, rol FROM usuarios");
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getPendingCompanies = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM empresas WHERE estado = 'Pendiente'");
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateEmpresaEstado = async (req, res) => {
    const { id_empresa, estado } = req.body;
    try {
        await db.query("UPDATE empresas SET estado = ? WHERE id_empresa = ?", [estado, id_empresa]);
        res.json({ success: true, message: "Empresa actualizada" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
