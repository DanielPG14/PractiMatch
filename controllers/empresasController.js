const db = require('../config/database');

// --- PERFIL ---
exports.getPerfilEmpresa = async (req, res) => {
    try {
        const id_usuario = req.session.usuario.id;
        const query = `
            SELECT e.nombre_empresa, u.rfc, u.correo, u.nombre AS nombre_contacto
            FROM empresas e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE u.id_usuario = ?`;
        const [results] = await db.query(query, [id_usuario]);
        if (results.length === 0) return res.status(404).json({ success: false, error: "Perfil no encontrado" });
        res.json({ success: true, data: results[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updatePerfilEmpresa = async (req, res) => {
    try {
        const id_usuario = req.session.usuario.id;
        const { nombre_empresa, rfc, correo, nombre_contacto } = req.body;
        await db.query('UPDATE usuarios SET rfc = ?, correo = ?, nombre = ? WHERE id_usuario = ?', [rfc, correo, nombre_contacto, id_usuario]);
        await db.query('UPDATE empresas SET nombre_empresa = ? WHERE id_usuario = ?', [nombre_empresa, id_usuario]);
        res.json({ success: true, mensaje: "Perfil actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- BECARIOS ---
exports.getEmpresaBecarios = async (req, res) => {
    try {
        const id_usuario = req.session.usuario.id;
        // Eliminado p.tipo_proceso porque no existe en la tabla postulaciones según tu imagen
        const query = `
            SELECT 
                u.nombre AS nombre_becario, u.rfc, e.matricula, e.carrera, e.id_estudiante,
                (SELECT ruta_archivo FROM documentos_alumno WHERE id_estudiante = e.id_estudiante AND nombre_documento LIKE '%CV%' LIMIT 1) AS cv_url,
                (SELECT ruta_archivo FROM documentos_alumno WHERE id_estudiante = e.id_estudiante AND nombre_documento LIKE '%Seguro%' LIMIT 1) AS seguro_url
            FROM postulaciones p
            INNER JOIN vacantes v ON p.id_vacante = v.id_vacante
            INNER JOIN empresas emp ON v.id_empresa = emp.id_empresa
            INNER JOIN estudiantes e ON p.id_estudiante = e.id_estudiante
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE emp.id_usuario = ? AND p.estatus = 'Aceptado'`;

        const [results] = await db.query(query, [id_usuario]);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error en Becarios:", error);
        res.status(500).json({ success: false, error: "Error al obtener becarios" });
    }
};

// --- VACANTES ---
exports.getEmpresaVacantes = async (req, res) => {
    try {
        const id_usuario = req.session.usuario.id;
        const query = `
            SELECT v.* FROM vacantes v
            INNER JOIN empresas e ON v.id_empresa = e.id_empresa
            WHERE e.id_usuario = ?
            ORDER BY v.fecha_creacion DESC`; // Corregido a fecha_creacion
        const [results] = await db.query(query, [id_usuario]);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Se eliminó la función duplicada guardarVacante para usar solo esta:
exports.createEmpresaVacante = async (req, res) => {
    try {
        const id_usuario = req.session.usuario.id;
        // Agregado tipo_proceso que es obligatorio en tu DB
        const { titulo, descripcion, requisitos, ubicacion, tipo_proceso } = req.body;

        const [empresa] = await db.query('SELECT id_empresa FROM empresas WHERE id_usuario = ?', [id_usuario]);

        if (!empresa.length) {
            return res.status(400).json({ success: false, error: "No tienes una empresa vinculada." });
        }

        // Corregido: fecha_creacion y añadida columna tipo_proceso
        const query = `
            INSERT INTO vacantes (id_empresa, titulo, descripcion, requisitos, ubicacion, tipo_proceso, fecha_creacion) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`;

        await db.query(query, [empresa[0].id_empresa, titulo, descripcion, requisitos, ubicacion, tipo_proceso]);
        
        res.json({ success: true, mensaje: "Vacante creada exitosamente" });
    } catch (error) {
        console.error("Error al crear vacante:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- POSTULACIONES ---
exports.getEmpresaPostulaciones = async (req, res) => {
    try {
        const id_usuario = req.session.usuario.id;
        const query = `
            SELECT p.id_postulacion, v.titulo AS vacante_titulo, p.estatus, u.nombre AS nombre_alumno, u.correo AS correo_alumno,
            (SELECT ruta_archivo FROM documentos_alumno WHERE id_estudiante = e.id_estudiante AND nombre_documento LIKE '%CV%' LIMIT 1) AS cv_url
            FROM postulaciones p
            INNER JOIN vacantes v ON p.id_vacante = v.id_vacante
            INNER JOIN empresas emp ON v.id_empresa = emp.id_empresa
            INNER JOIN estudiantes e ON p.id_estudiante = e.id_estudiante
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE emp.id_usuario = ?
            ORDER BY p.fecha_postulacion DESC`;
        const [results] = await db.query(query, [id_usuario]);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.getVacantesDisponibles = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const tipo_proceso = req.session?.tipo_proceso;

        const [alumno] = await db.query('SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        if (!alumno.length) return res.status(404).json({ success: false, error: "Alumno no encontrado" });
        
        const id_estudiante = alumno[0].id_estudiante;

        // Trae las vacantes del proceso correspondiente a las que el alumno AÚN NO se ha postulado
        const query = `
            SELECT v.id_vacante, v.titulo, v.descripcion, v.requisitos, v.ubicacion, e.nombre_empresa 
            FROM vacantes v
            INNER JOIN empresas e ON v.id_empresa = e.id_empresa
            WHERE v.tipo_proceso = ?
            AND v.id_vacante NOT IN (SELECT id_vacante FROM postulaciones WHERE id_estudiante = ?)
            ORDER BY v.fecha_creacion DESC
        `;
        const [vacantes] = await db.query(query, [tipo_proceso, id_estudiante]);
        res.json({ success: true, data: vacantes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.postularVacante = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const { id_vacante } = req.body;

        const [alumno] = await db.query('SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        if (!alumno.length) return res.status(404).json({ success: false, error: "Alumno no encontrado" });

        // Inserta la postulación con estatus 'En proceso' (El estudiante acaba de aplicar)
        const query = `
            INSERT INTO postulaciones (id_estudiante, id_vacante, estatus, fecha_postulacion) 
            VALUES (?, ?, 'En proceso', CURDATE())
        `;
        await db.query(query, [alumno[0].id_estudiante, id_vacante]);
        
        res.json({ success: true, mensaje: "Te has postulado correctamente." });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error al postularse. Es posible que ya estés postulado." });
    }
};

exports.getMisPostulaciones = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const [alumno] = await db.query('SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        
        const query = `
            SELECT p.id_postulacion, p.estatus, p.fecha_postulacion, v.titulo, e.nombre_empresa
            FROM postulaciones p
            INNER JOIN vacantes v ON p.id_vacante = v.id_vacante
            INNER JOIN empresas e ON v.id_empresa = e.id_empresa
            WHERE p.id_estudiante = ?
            ORDER BY p.fecha_postulacion DESC
        `;
        const [postulaciones] = await db.query(query, [alumno[0].id_estudiante]);
        res.json({ success: true, data: postulaciones });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// RESPUESTA DE LA EMPRESA: Pre-aceptar o Rechazar un candidato
exports.responderPostulacion = async (req, res) => {
    try {
        const { id_postulacion, estado } = req.body;
        
        // Validar que el estado sea uno de los permitidos para respuesta de empresa
        const estadosValidos = ['En revisión', 'Rechazado'];
        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).json({ success: false, error: "Estado no válido. Solo se permite 'En revisión' o 'Rechazado'" });
        }
        
        // Actualizar el estado de la postulación
        const [result] = await db.query(
            'UPDATE postulaciones SET estatus = ? WHERE id_postulacion = ?', 
            [estado, id_postulacion]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Postulación no encontrada" });
        }

        res.json({ success: true, mensaje: `Postulación marcada como '${estado}' correctamente.` });
    } catch (error) {
        console.error("Error en responderPostulacion (empresa):", error);
        res.status(500).json({ success: false, error: error.message });
    }
};