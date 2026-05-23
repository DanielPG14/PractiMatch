const db = require('../config/database');

// --- 1. DASHBOARD ---
exports.getDashboard = async (req, res) => {
    try {
        const query = `
            SELECT u.correo, v.titulo AS vacante_titulo, p.estatus
            FROM postulaciones p
            INNER JOIN estudiantes e ON p.id_estudiante = e.id_estudiante
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            INNER JOIN vacantes v ON p.id_vacante = v.id_vacante
            ORDER BY p.id_postulacion DESC LIMIT 10
        `;
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error en getDashboard:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 2. USUARIOS ---
exports.getAllUsers = async (req, res) => {
    try {
        const [results] = await db.query("SELECT id_usuario, nombre, correo, rfc, rol FROM usuarios ORDER BY rol ASC");
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error en getAllUsers:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 3. EMPRESAS ---
exports.getEmpresas = async (req, res) => {
    try {
        const query = `
            SELECT e.id_empresa, e.nombre_empresa, e.estado, u.rfc, u.correo
            FROM empresas e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            ORDER BY CASE WHEN e.estado = 'Pendiente' THEN 1 ELSE 2 END, e.nombre_empresa ASC
        `;
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error en getEmpresas:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateEstatusEmpresa = async (req, res) => {
    const { id_empresa, estado } = req.body;
    try {
        await db.query("UPDATE empresas SET estado = ? WHERE id_empresa = ?", [estado, id_empresa]);
        res.json({ success: true, mensaje: "Estatus de empresa actualizado." });
    } catch (err) {
        console.error('Error en updateEstatusEmpresa:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 4. VACANTES ---
exports.getVacantesRevision = async (req, res) => {
    try {
        // CORRECCIÓN: Se agregó v.tipo_proceso a la consulta
        const query = `
            SELECT 
                v.id_vacante, 
                v.titulo, 
                v.tipo_proceso,
                v.fecha_creacion, 
                v.estado,
                e.nombre_empresa, 
                u.correo 
            FROM vacantes v
            INNER JOIN empresas e ON v.id_empresa = e.id_empresa
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            ORDER BY CASE WHEN v.estado = 'Pendiente' THEN 1 ELSE 2 END, v.fecha_creacion DESC
        `;
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error en getVacantesRevision:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateEstatusVacante = async (req, res) => {
    const { id_vacante, estado } = req.body;
    try {
        await db.query("UPDATE vacantes SET estado = ? WHERE id_vacante = ?", [estado, id_vacante]);
        res.json({ success: true, mensaje: "Estatus de vacante actualizado." });
    } catch (err) {
        console.error('Error en updateEstatusVacante:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 5. DOCUMENTOS ---
exports.getDocumentosAlumnos = async (req, res) => {
    try {
        const query = `
            SELECT da.id_documento, da.nombre_documento, da.ruta_archivo, da.estado, 
                   da.fecha_subida, e.matricula, u.nombre AS nombre_alumno, e.tipo_proceso
            FROM documentos_alumno da
            INNER JOIN estudiantes e ON da.id_estudiante = e.id_estudiante
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            ORDER BY CASE WHEN da.estado = 'Pendiente' THEN 1 ELSE 2 END, da.fecha_subida DESC
        `;
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error en getDocumentosAlumnos:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateDocumentoEstado = async (req, res) => {
    const { id_documento, estado, comentario_rechazo } = req.body;
    try {
        const comentario = estado === 'Rechazado' ? comentario_rechazo : null;
        await db.query(
            "UPDATE documentos_alumno SET estado = ?, comentario_rechazo = ? WHERE id_documento = ?", 
            [estado, comentario, id_documento]
        );
        res.json({ success: true, mensaje: "Documento actualizado." });
    } catch (err) {
        console.error('Error en updateDocumentoEstado:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};