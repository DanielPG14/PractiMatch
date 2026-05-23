const generic = require('./genericController');
const db = require('../config/database');

const TABLE = 'estudiantes';
const ID = 'id_estudiante';

exports.getPerfil = async (req, res) => {
    try {
        if (!req.session?.usuario?.id) {
            return res.status(401).json({ success: false, mensaje: "Sesión expirada." });
        }

        const query = `
            SELECT e.id_estudiante, e.matricula, e.carrera, e.tipo_proceso, 
                   u.rfc, u.correo, u.nombre
            FROM estudiantes e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE u.id_usuario = ?
        `;

        const [results] = await db.query(query, [req.session.usuario.id]);

        if (results.length > 0) {
            req.session.matricula = results[0].matricula;
            req.session.tipo_proceso = results[0].tipo_proceso;
            req.session.id_estudiante = results[0].id_estudiante;
            
            res.json({ success: true, data: results[0] });
        } else {
            res.status(404).json({ success: false, mensaje: "Estudiante no encontrado." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error interno" });
    }
};

exports.updatePerfil = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const { correo } = req.body;

        if (!id_usuario) return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        if (!correo) return res.status(400).json({ success: false, mensaje: "El correo es requerido" });

        const query = "UPDATE usuarios SET correo = ? WHERE id_usuario = ?";
        const [result] = await db.query(query, [correo, id_usuario]);

        if (result.affectedRows > 0) {
            req.session.usuario.correo = correo;
            res.json({ success: true, mensaje: "Correo actualizado correctamente" });
        } else {
            res.status(400).json({ success: false, mensaje: "No se pudo actualizar el correo" });
        }
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, mensaje: "Ese correo ya está registrado por otro usuario" });
        }
        res.status(500).json({ success: false, error: "Error al actualizar" });
    }
};

exports.subirDocumento = async (req, res) => {
    try {
        // req.file ya contiene el nombre final asignado por Multer
        if (!req.file) return res.status(400).json({ success: false, error: 'No se recibió archivo o formato no válido.' });
        if (!req.session?.usuario?.id) return res.status(401).json({ success: false, error: 'Sesión no válida.' });

        const id_usuario = req.session.usuario.id;
        const { nombreDocumento } = req.body;

        if (!nombreDocumento) return res.status(400).json({ success: false, error: 'Falta el identificador del documento.' });

        const [alumno] = await db.query('SELECT id_estudiante, matricula FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        if (alumno.length === 0) return res.status(404).json({ success: false, error: 'Alumno no encontrado.' });

        const { id_estudiante, matricula } = alumno[0];
        const rutaRelativa = `/uploads/documentos_alumnos/${matricula}/${req.file.filename}`;

        // Nota: Para que el ON DUPLICATE KEY funcione, la BD debe tener un índice UNIQUE en (id_estudiante, nombre_documento)
        const queryUpsert = `
            INSERT INTO documentos_alumno (id_estudiante, nombre_documento, ruta_archivo, estado)
            VALUES (?, ?, ?, 'Pendiente')
            ON DUPLICATE KEY UPDATE 
                ruta_archivo = VALUES(ruta_archivo), 
                estado = 'Pendiente', 
                comentario_rechazo = NULL, 
                fecha_subida = CURRENT_TIMESTAMP
        `;

        await db.query(queryUpsert, [id_estudiante, nombreDocumento, rutaRelativa]);

        res.json({ success: true, mensaje: `Documento actualizado exitosamente.`, ruta: rutaRelativa });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al registrar documento en la base de datos.' });
    }
};

exports.getEstatusProcesoAlumno = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        if (!id_usuario) return res.status(401).json({ success: false, error: "Sesión no válida" });

        const [alumno] = await db.query('SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        if (alumno.length === 0) return res.status(404).json({ success: false, error: "No encontrado" });

        const id_estudiante = alumno[0].id_estudiante;
        const docsIniciales = ['INE', 'CURP', 'Constancia de Estudios', 'Seguro Facultativo', 'Curriculum Vitae (CV)'];
        const docsFinales = ['Carta Presentación', 'Carta Compromiso', 'Evaluación'];

        const [documentos] = await db.query('SELECT nombre_documento, estado FROM documentos_alumno WHERE id_estudiante = ?', [id_estudiante]);
        const [postulaciones] = await db.query('SELECT estatus FROM postulaciones WHERE id_estudiante = ?', [id_estudiante]);

        const inicialesAprobados = docsIniciales.every(nombre => 
            documentos.some(d => d.nombre_documento === nombre && d.estado === 'Aprobado')
        );

        const tienePostulacionAprobada = postulaciones.some(p => p.estatus === 'Aprobado');
        const finalesSubidos = docsFinales.every(nombre => documentos.some(d => d.nombre_documento === nombre));
        const finalesAprobados = docsFinales.every(nombre => 
            documentos.some(d => d.nombre_documento === nombre && d.estado === 'Aprobado')
        );

        let estado = 1;
        if (finalesAprobados && tienePostulacionAprobada) estado = 5;
        else if (finalesSubidos && tienePostulacionAprobada) estado = 4;
        else if (tienePostulacionAprobada) estado = 3;
        else if (inicialesAprobados) estado = 2;

        res.json({ success: true, estado });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getMisDocumentos = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const [alumno] = await db.query('SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        if (alumno.length === 0) return res.status(404).json({ success: false });
        
        const [docs] = await db.query('SELECT * FROM documentos_alumno WHERE id_estudiante = ?', [alumno[0].id_estudiante]);
        res.json({ success: true, data: docs });
    } catch (err) { res.status(500).json({ success: false }); }
};

exports.seleccionarProceso = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const { tipo_proceso } = req.body;

        if (!id_usuario) return res.status(401).json({ success: false, mensaje: "Sesión no válida" });
        if (!tipo_proceso) return res.status(400).json({ success: false, mensaje: "Tipo de proceso requerido" });

        const query = "UPDATE estudiantes SET tipo_proceso = ? WHERE id_usuario = ?";
        const [result] = await db.query(query, [tipo_proceso, id_usuario]);

        if (result.affectedRows > 0) {
            req.session.tipo_proceso = tipo_proceso; 
            res.json({ success: true, mensaje: "Proceso actualizado" });
        } else {
            res.status(400).json({ success: false, mensaje: "No se pudo actualizar" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error interno" });
    }
};

exports.getVacantesDisponibles = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const tipo_proceso = req.session?.tipo_proceso;

        if (!id_usuario) {
            return res.status(401).json({ success: false, error: "Sesión no válida" });
        }

        // 1. Buscamos el ID del estudiante
        const [alumno] = await db.query('SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        
        if (alumno.length === 0) {
            return res.status(404).json({ success: false, error: "Estudiante no encontrado" });
        }

        const id_estudiante = alumno[0].id_estudiante;

        // 2. Consulta con los nombres de columna correctos (estado)
        // Solo mostramos vacantes 'Aprobado' y que coincidan con el tipo de proceso
        const query = `
            SELECT 
                v.id_vacante, 
                v.titulo, 
                v.descripcion, 
                v.requisitos, 
                v.ubicacion,
                e.nombre_empresa 
            FROM vacantes v
            INNER JOIN empresas e ON v.id_empresa = e.id_empresa
            WHERE v.tipo_proceso = ? 
            AND v.estado = 'Aprobado'
            AND NOT EXISTS (
                SELECT 1 
                FROM postulaciones p 
                WHERE p.id_vacante = v.id_vacante 
                AND p.id_estudiante = ?
            )
        `;

        const [vacantes] = await db.query(query, [tipo_proceso, id_estudiante]);
        
        res.json({ success: true, data: vacantes });

    } catch (err) {
        console.error("DETALLE DEL ERROR EN VACANTES:", err); 
        res.status(500).json({ success: false, error: "Error al obtener las vacantes disponibles" });
    }
};

exports.postularVacante = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const { id_vacante } = req.body;

        const [alumno] = await db.query('SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?', [id_usuario]);
        if (alumno.length === 0) return res.status(404).json({ success: false, error: "Alumno no encontrado" });

        const query = "INSERT INTO postulaciones (id_estudiante, id_vacante, estatus) VALUES (?, ?, 'Pendiente')";
        await db.query(query, [alumno[0].id_estudiante, id_vacante]);

        res.json({ success: true, mensaje: "Postulación enviada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error al postularse" });
    }
};

exports.getMisPostulaciones = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const query = `
            SELECT p.*, v.titulo, e.nombre_empresa 
            FROM postulaciones p
            JOIN vacantes v ON p.id_vacante = v.id_vacante
            JOIN empresas e ON v.id_empresa = e.id_empresa
            WHERE p.id_estudiante = (SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?)
        `;
        const [postulaciones] = await db.query(query, [id_usuario]);
        res.json({ success: true, data: postulaciones });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error al obtener postulaciones" });
    }
};

// RESPUESTA DEL ALUMNO: Aceptar o Rechazar una postulación pre-aceptada por empresa
exports.responderPostulacion = async (req, res) => {
    try {
        const id_usuario = req.session?.usuario?.id;
        const { id_postulacion, respuesta } = req.body;
        
        // Validar que la respuesta sea válida
        if (!['Aprobado', 'Rechazado'].includes(respuesta)) {
            return res.status(400).json({ success: false, error: "Respuesta no válida. Solo se permite 'Aprobado' o 'Rechazado'" });
        }
        
        if (!id_usuario) {
            return res.status(401).json({ success: false, error: "Sesión no válida" });
        }
        
        // Actualizar la postulación con la respuesta del alumno
        const [result] = await db.query(
            'UPDATE postulaciones SET estatus = ? WHERE id_postulacion = ?',
            [respuesta, id_postulacion]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Postulación no encontrada" });
        }
        
        // Si el alumno aceptó, rechazar automáticamente las demás en revisión o en proceso
        if (respuesta === 'Aprobado') {
            const [alumno] = await db.query(
                'SELECT id_estudiante FROM estudiantes WHERE id_usuario = ?',
                [id_usuario]
            );
            
            if (alumno.length > 0) {
                await db.query(
                    'UPDATE postulaciones SET estatus = "Rechazado" WHERE id_estudiante = ? AND id_postulacion != ? AND estatus IN ("En revisión", "En proceso")',
                    [alumno[0].id_estudiante, id_postulacion]
                );
            }
        }

        res.json({ success: true, mensaje: `Postulación ${respuesta === 'Aprobado' ? 'aceptada' : 'rechazada'} correctamente.` });
    } catch (err) {
        console.error("Error en responderPostulacion (alumno):", err);
        res.status(500).json({ success: false, error: "Error al responder a la postulación" });
    }
};