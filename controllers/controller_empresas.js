const { obtenerEmpresas, actualizarEstadoEmpresa } = require('../models/model_empresas');

async function listarEmpresas(req, res) {
    try {
        const empresas = await obtenerEmpresas();
        res.json(empresas);
    } catch (error) {
        console.error("Error al listar empresas:", error);
        res.status(500).json({ mensaje: "Error al obtener empresas" });
    }
}

async function aprobarRechazarEmpresa(req, res) {
    const { id_empresa, estado } = req.body;
    // Solo admin puede hacer esto
    if (req.session.usuario?.rol !== 'Admin') {
        return res.status(403).json({ mensaje: "No tienes permiso" });
    }
    try {
        await actualizarEstadoEmpresa(id_empresa, estado);
        res.json({ mensaje: `Empresa ${estado} correctamente` });
    } catch (error) {
        console.error("Error al actualizar empresa:", error);
        res.status(500).json({ mensaje: "Error al actualizar empresa" });
    }
}

module.exports = { listarEmpresas, aprobarRechazarEmpresa };