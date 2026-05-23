// =====================================================
// 1. VARIABLES GLOBALES Y UTILIDADES
// =====================================================
let procesoAlumnoSeleccionado = null;

// Función vital para evitar problemas de mayúsculas y acentos entre la BD y el Frontend
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// =====================================================
// 2. GESTIÓN DE SESIÓN Y AUTENTICACIÓN
// =====================================================
async function iniciarSesion() {
    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    try {
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({correo, contrasena})
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) return alert(datos.mensaje);

        // Redirección por roles
        const rutas = {
            'Admin': 'admin_view.html',
            'Estudiante': 'dashboardAlumno_view.html',
            'Empresa': 'dashboardEmpresa_view.html'
        };
        if (rutas[datos.rol]) window.location.href = `/html/${rutas[datos.rol]}`;

    } catch (error) {
        console.error("Error login:", error);
        alert("Error al conectar con el servidor");
    }
}

async function cerrarSesion() {
    try {
        const respuesta = await fetch('/api/auth/logout', {method: 'POST'});
        if (respuesta.ok) window.location.href = '/html/login_view.html';
    } catch (error) {
        console.error("Error logout:", error);
    }
}

// =====================================================
// 3. UTILIDADES DE RENDERIZADO TABLAS (FRONTEND)
// =====================================================
function crearFilaPostulacion(p) {
    const clases = {
        'Aprobado': 'badge-aprobado',
        'Rechazado': 'badge-rechazado',
        'En proceso': 'badge-nuevo',
        'En revisión': 'badge-revision',
        'Finalizado': 'badge-finalizado'
    };
    const claseBadge = clases[p.estatus] || 'badge-pendiente';

    return `
    <tr>
      <td>#${p.id_postulacion}</td>
      <td>${p.matricula || 'N/A'}</td>
      <td>${p.correo || 'N/A'}</td>
      <td>${p.tipo_proceso || 'Vacante'}</td>
      <td>${p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleDateString() : 'N/A'}</td>
      <td><span class="badge ${claseBadge}">${p.estatus || 'Pendiente'}</span></td>
    </tr>
  `;
}

async function cargarDatosTabla(endpoint, tableBodyId, filterFn = null, msg = 'Sin datos') {
    const tabla = document.getElementById(tableBodyId);
    if (!tabla) return;

    try {
        const res = await fetch(endpoint);
        const json = await res.json();
        let lista = json.data || [];

        if (filterFn) lista = lista.filter(filterFn);

        tabla.innerHTML = lista.length > 0
            ? lista.map(crearFilaPostulacion).join('')
            : `<tr><td colspan="6" style="text-align:center;">${msg}</td></tr>`;
    } catch (error) {
        tabla.innerHTML = "<tr><td colspan='6' style='color:red;'>Error de conexión</td></tr>";
    }
}

async function cargarDatosTablaGenerica(endpoint, tableBodyId, rowFn, msg = 'Sin datos') {
    const tabla = document.getElementById(tableBodyId);
    if (!tabla) return;
    try {
        const res = await fetch(endpoint);
        const json = await res.json();
        const lista = json.data || [];
        tabla.innerHTML = lista.length > 0 ? lista.map(rowFn).join('') : `<tr><td colspan="6" style="text-align:center;">${msg}</td></tr>`;
    } catch (e) {
        tabla.innerHTML = "<tr><td colspan='6' style='color:red;'>Error al cargar datos</td></tr>";
    }
}

// =====================================================
// 4. SECCIONES DINÁMICAS (DASHBOARD EMPRESA)
// =====================================================
function renderRequisitosSection() {
    document.getElementById('content-area').innerHTML = `
    <section class="panel-section">
      <div>
        <h2>Publicar Nueva Vacante</h2>
        <p class="section-subtitle">Crea una vacante y conecta con estudiantes que buscan tu proceso.</p>
      </div>
      <form id="vacante-form" class="form-section">
        <div class="form-group">
          <label for="tipo-proceso">Tipo de Proceso</label>
          <select id="tipo-proceso" required>
            <option value="Servicio">Servicio Social</option>
            <option value="Práctica">Práctica Profesional</option>
            <option value="Integrativa">Integrativa Profesional</option>
          </select>
        </div>
        <div class="form-group">
          <label for="vacante-descripcion">Descripción detallada</label>
          <textarea id="vacante-descripcion" rows="5" required placeholder="Describe las responsabilidades de la vacante..."></textarea>
        </div>
        <div class="form-group">
          <label for="vacante-requisitos">Requisitos (opcional)</label>
          <textarea id="vacante-requisitos" rows="3" placeholder="Ej. Ingeniería, inglés, disponibilidad de 6 meses..."></textarea>
        </div>
        <div class="form-footer">
          <button type="submit" class="btn-primario">Crear Vacante</button>
          <div id="vacante-message"></div>
        </div>
      </form>
    </section>
  `;
    document.getElementById('vacante-form').addEventListener('submit', handleVacanteSubmit);
}

function renderSolicitudesSection() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Solicitudes Recibidas</h2>
      <table>
        <thead>
          <tr><th>Folio</th><th>Matrícula</th><th>Correo</th><th>Tipo</th><th>Fecha</th><th>Estado</th></tr>
        </thead>
        <tbody id="tabla-solicitudes"></tbody>
      </table>
    </div>`;
    cargarDatosTabla('/api/postulaciones', 'tabla-solicitudes', null, 'No hay solicitudes');
}

function renderBecariosSection() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Mis Becarios Activos</h2>
      <table>
        <thead>
          <tr><th>Folio</th><th>Matrícula</th><th>Correo</th><th>Tipo</th><th>Fecha</th><th>Estado</th></tr>
        </thead>
        <tbody id="tabla-becarios"></tbody>
      </table>
    </div>`;
    cargarDatosTabla('/api/postulaciones', 'tabla-becarios', b => b.estatus === 'Aprobado', 'No tienes becarios aprobados');
}

async function handleVacanteSubmit(e) {
    e.preventDefault();
    const msg = document.getElementById('vacante-message');
    const payload = {
        tipo_proceso: document.getElementById('tipo-proceso').value,
        descripcion: document.getElementById('vacante-descripcion').value.trim(),
        requisitos: document.getElementById('vacante-requisitos').value.trim()
    };

    try {
        const res = await fetch('/api/vacantes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const datos = await res.json();

        if (res.ok) {
            msg.innerHTML = "<p class='text-sm text-green-600'>✅ Vacante guardada correctamente</p>";
            e.target.reset();
            setTimeout(() => cargarSeccionEmpresa('solicitudes'), 2000);
        } else {
            msg.innerHTML = `<p class='text-sm text-red-600'>❌ ${datos.error || 'Error al guardar'}</p>`;
        }
    } catch (error) {
        msg.innerHTML = "<p class='text-sm text-red-600'>❌ Error de conexión</p>";
    }
}

function cargarSeccionEmpresa(section) {
    const vistas = {
        'requisitos': renderRequisitosSection,
        'solicitudes': renderSolicitudesSection,
        'becarios': renderBecariosSection
    };
    if (vistas[section]) vistas[section]();
}

// =====================================================
// 5. SECCIONES DINÁMICAS (DASHBOARD ADMINISTRADOR)
// =====================================================
function cargarSeccionAdmin(section) {
    const vistas = {
        'dashboard': renderAdminDashboard,
        'alumnos': renderAdminUsuarios,
        'empresas-pendientes': renderAdminEmpresasPendientes,
        'solicitudes': renderAdminSolicitudes,
        'validar-documentos': renderAdminDocumentos 
    };
    if (vistas[section]) vistas[section]();
}

function renderAdminDashboard() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Panel de Control Global</h2>
      <p>Bienvenido, Admin. Aquí puedes gestionar la integridad del sistema.</p>
    </div>`;
}

function renderAdminUsuarios() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Gestión de Usuarios</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th></tr>
        </thead>
        <tbody id="tabla-admin-usuarios"></tbody>
      </table>
    </div>`;
    const rowUser = (u) => `<tr><td>${u.id_usuario}</td><td>${u.nombre}</td><td>${u.correo}</td><td>${u.rol}</td></tr>`;
    cargarDatosTablaGenerica('/api/admin/usuarios', 'tabla-admin-usuarios', rowUser);
}

function renderAdminSolicitudes() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Solicitudes Globales (Dashboard)</h2>
      <table>
        <thead>
          <tr><th>Usuario</th><th>Vacante</th><th>Estado</th></tr>
        </thead>
        <tbody id="tabla-admin-dashboard"></tbody>
      </table>
    </div>`;
    const rowAdminDashboard = (p) => `<tr><td>${p.correo}</td><td>${p.vacante_titulo}</td><td><span class="badge badge-revision">${p.estatus}</span></td></tr>`;
    cargarDatosTablaGenerica('/api/admin/dashboard', 'tabla-admin-dashboard', rowAdminDashboard);
}

function renderAdminEmpresasPendientes() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Empresas esperando aprobación</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Empresa</th><th>Estado</th><th>Acción</th></tr>
        </thead>
        <tbody id="tabla-empresas-pendientes"></tbody>
      </table>
    </div>`;
    const rowEmpresa = (e) => `
        <tr>
            <td>${e.id_empresa}</td>
            <td>${e.nombre_empresa}</td>
            <td><span class="badge badge-pendiente">${e.estado}</span></td>
            <td>
                <button class="btn-primario" onclick="cambiarEstadoEmpresa(${e.id_empresa}, 'APROBADO')">Aprobar</button>
                <button class="btn-peligro" onclick="cambiarEstadoEmpresa(${e.id_empresa}, 'RECHAZADO')">X</button>
            </td>
        </tr>`;
    cargarDatosTablaGenerica('/api/admin/empresas/pendientes', 'tabla-empresas-pendientes', rowEmpresa);
}

async function cambiarEstadoEmpresa(id, nuevoEstado) {
    if(!confirm(`¿Seguro que quieres cambiar el estado a ${nuevoEstado}?`)) return;
    try {
        const res = await fetch(`/api/admin/empresas/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_empresa: id, estado: nuevoEstado })
        });
        const data = await res.json();
        if (data.success) {
            alert("Estado actualizado");
            renderAdminEmpresasPendientes();
        }
    } catch (e) {
        console.error("Error al actualizar:", e);
    }
}

function renderAdminDocumentos() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Validación de Documentos de Alumnos</h2>
      <p class="section-subtitle">Revisa los expedientes cargados por los estudiantes activos.</p>
      <table>
        <thead>
          <tr>
            <th>Alumno / Matrícula</th>
            <th>Proceso</th>
            <th>Documento</th>
            <th>Fecha Subida</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-admin-documentos"></tbody>
      </table>
    </div>`;

    const rowDocumento = (doc) => {
        let claseBadge = 'badge-pendiente';
        if (doc.estado === 'Aprobado') claseBadge = 'badge-aprobado';
        if (doc.estado === 'Rechazado') claseBadge = 'badge-rechazado';

        const fechaFormateada = doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleDateString() : 'N/A';

        return `
        <tr>
            <td>
                <strong>${doc.nombre_alumno}</strong><br>
                <span style="font-size: 0.85em; color: gray;">Matrícula: ${doc.matricula}</span>
            </td>
            <td>${doc.tipo_proceso || 'General'}</td>
            <td><strong>${doc.nombre_documento}</strong></td>
            <td>${fechaFormateada}</td>
            <td><span class="badge ${claseBadge}">${doc.estado}</span></td>
            <td>
                <a href="${doc.ruta_archivo}" target="_blank" class="btn-primario" style="text-decoration:none; padding: 4px 8px; font-size:0.9em; display:inline-block; margin-bottom:2px;">Ver Archivo</a>
                <button class="btn-subir" style="background-color: #2ecc71; margin-bottom:2px;" onclick="cambiarEstadoDocumento(${doc.id_documento}, 'Aprobado')">✓</button>
                <button class="btn-peligro" onclick="cambiarEstadoDocumento(${doc.id_documento}, 'Rechazado')">✗</button>
            </td>
        </tr>`;
    };
    cargarDatosTablaGenerica('/api/admin/documentos', 'tabla-admin-documentos', rowDocumento, 'No hay documentos cargados en el sistema.');
}

async function cambiarEstadoDocumento(idDocumento, nuevoEstado) {
    let comentario = null;
    if (nuevoEstado === 'Rechazado') {
        comentario = prompt("Escribe el motivo del rechazo del documento (este mensaje lo verá el alumno):");
        if (comentario === null) return;
        if (comentario.trim() === "") return alert("Debes indicar un motivo de rechazo obligatoriamente.");
    } else {
        if (!confirm("¿Estás seguro de marcar este documento como APROBADO?")) return;
    }

    try {
        const res = await fetch('/api/admin/documentos/estado', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_documento: idDocumento, estado: nuevoEstado, comentario_rechazo: comentario })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            alert(`Documento marcado como ${nuevoEstado}`);
            renderAdminDocumentos();
        } else {
            alert("Error al actualizar: " + (data.error || 'Inténtalo de nuevo'));
        }
    } catch (e) {
        alert("Ocurrió un error al procesar la solicitud.");
    }
}

// =====================================================
// 6. PERFIL DE EMPRESAS (POP UP)
// =====================================================
async function cargarPerfilEmpresa() {
    try {
        const res = await fetch('/api/empresas/perfil');
        if (!res.ok) {
            const errorData = await res.json();
            return alert(`⚠️ Error: ${errorData.mensaje || 'No se encontró el perfil'}`);
        }
        const resJson = await res.json();
        if (resJson.success && resJson.data) {
            const data = resJson.data;
            document.getElementById('perfil-nombre').value = data.nombre_empresa || '';
            document.getElementById('perfil-rfc').value = data.rfc || '';
            document.getElementById('perfil-correo').value = data.correo || '';
            document.getElementById('perfil-contacto').value = data.nombre_contacto || '';
            document.getElementById('perfil-estado').textContent = data.estado || '';

            deshabilitarEdicion();
            document.getElementById('modal-perfil').style.display = 'flex';
        }
    } catch (error) {
        alert("No se pudo conectar con el servidor.");
    }
}

function abrirModalPerfil() { cargarPerfilEmpresa(); }

function habilitarEdicion() {
    document.getElementById('perfil-nombre').disabled = false;
    document.getElementById('perfil-rfc').disabled = false;
    document.getElementById('perfil-contacto').disabled = false;
    document.getElementById('perfil-correo').disabled = false;
    document.getElementById('btn-editar-activar').style.display = 'none';
    document.getElementById('btn-guardar-perfil').style.display = 'inline-block';
}

function deshabilitarEdicion() {
    document.getElementById('perfil-nombre').disabled = true;
    document.getElementById('perfil-rfc').disabled = true;
    document.getElementById('perfil-contacto').disabled = true;
    document.getElementById('perfil-correo').disabled = true;
    document.getElementById('btn-editar-activar').style.display = 'inline-block';
    document.getElementById('btn-guardar-perfil').style.display = 'none';
}

function cerrarModalPerfil() { document.getElementById('modal-perfil').style.display = 'none'; }

// =====================================================
// 7. SECCIONES DEL ALUMNO (DASHBOARD ESTUDIANTE)
// =====================================================
async function verificarEstatusProcesoAlumno() {
    try {
        const res = await fetch('/api/estudiantes/perfil');
        if (!res.ok) return; 
        const json = await res.json();
        if (json.success && json.data) {
            procesoAlumnoSeleccionado = json.data.tipo_proceso || null;
            if(procesoAlumnoSeleccionado) {
                ajustarMenuLateral(procesoAlumnoSeleccionado);
            }
        }
    } catch (e) {
        console.error("Error consultando proceso del alumno:", e);
    }
}

async function renderDocumentosSection() {
    // Para renderizar, usamos la variable normalizada si existe
    const procesoNorm = normalizarTexto(procesoAlumnoSeleccionado);
    let titulo = 'Documentos Iniciales';
    let documentosRequeridos = [
        { nombre: 'INE' },
        { nombre: 'CURP' },
        { nombre: 'Comprobante de domicilio' },
        { nombre: 'Vigencia de seguro facultativo' }
    ];
    let mensajeExtra = 'Selecciona un proceso para adaptar los documentos requeridos.';

    if (procesoNorm.includes('servicio')) {
        titulo = 'Documentos requeridos para Servicio Social';
        documentosRequeridos = [
            { nombre: 'Carta Presentación' },
            { nombre: 'Carta Compromiso' },
            { nombre: 'Constancia de Término' }
        ];
        mensajeExtra = 'Para Servicio Social se requieren los documentos indicados.';
    } else if (procesoNorm.includes('practica') || procesoNorm.includes('integrativa')) {
        titulo = `Documentos requeridos para ${procesoAlumnoSeleccionado || 'tu proceso'}`;
        documentosRequeridos = [
            { nombre: 'Carta Presentación' },
            { nombre: 'Carta Compromiso' },
            { nombre: 'Valoración' },
            { nombre: 'Constancia de Término' }
        ];
        mensajeExtra = `Para tu proceso se requieren los documentos indicados.`;
    }

    let documentosSubidos = [];
    try {
        const res = await fetch('/api/estudiantes/mis-documentos'); 
        if (res.ok) {
            const json = await res.json();
            documentosSubidos = json.data || [];
        }
    } catch (e) {
        console.warn("No se pudieron cargar los documentos.");
    }

    // Comparamos usando la función normalizarTexto para evitar errores de escritura BD vs Frontend
    const todosAprobados = documentosRequeridos.every(req => {
        const docSubido = documentosSubidos.find(d => normalizarTexto(d.nombre_documento) === normalizarTexto(req.nombre));
        return docSubido && docSubido.estado === 'Aprobado';
    });

    let alertaValidacion = '';
    if (todosAprobados && documentosRequeridos.length > 0) {
        alertaValidacion = `
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c3e6cb; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5em;">✅</span>
                <strong>¡Felicidades! Todos tus documentos han sido validados y aprobados por la administración.</strong>
            </div>
        `;
    }

    const filas = documentosRequeridos.map(req => {
        const docSubido = documentosSubidos.find(d => normalizarTexto(d.nombre_documento) === normalizarTexto(req.nombre));
        const estadoFinal = docSubido ? docSubido.estado : 'No subido';
        
        let claseBadge = 'badge-pendiente';
        if (estadoFinal === 'Aprobado') claseBadge = 'badge-aprobado';
        if (estadoFinal === 'Rechazado') claseBadge = 'badge-rechazado';
        if (estadoFinal === 'No subido') claseBadge = 'badge-nuevo'; 

        // 👉 CORRECCIÓN: Si ya está subido (Aprobado, Pendiente o En revisión), ocultamos el botón de subir
        let btnSubirHtml = '';
        if (estadoFinal === 'Aprobado' || estadoFinal === 'Pendiente' || estadoFinal === 'En revisión') {
            btnSubirHtml = `<span style="color:gray; font-size:0.85em; font-weight: bold;">Subido (${estadoFinal})</span>`;
        } else {
            btnSubirHtml = `<button class="btn-subir" type="button" onclick="handleSubirDocumento('${req.nombre}')">Subir Archivo</button>`;
        }

        return `
            <tr>
                <td>${req.nombre}</td>
                <td><span class="badge ${claseBadge}">${estadoFinal}</span></td>
                <td>${btnSubirHtml}</td>
            </tr>
        `;
    }).join('');

    document.getElementById('content-area').innerHTML = `
        <div class="panel-section">
            <h2>${titulo}</h2>
            <p class="info-adicional">${mensajeExtra}</p>
            ${alertaValidacion}
            <div class="tabla-contenedor">
                <table>
                    <thead>
                        <tr><th>Documento</th><th>Estado</th><th>Acción</th></tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
        </div>
    `;
}

// 👉 CORRECCIÓN: Ahora le pasamos el filtro explícito a la sección de vacantes
function renderVacantesAlumnoSection(tipoFiltro) {
    const titulo = `Vacantes de ${tipoFiltro}`;
    document.getElementById('content-area').innerHTML = `
        <div class="panel-section">
            <h2>${titulo}</h2>
            <p class="info-adicional">Mostrando las vacantes registradas para ${tipoFiltro}.</p>
            <table>
                <thead>
                    <tr><th>Tipo</th><th>Empresa</th><th>Descripción</th><th>Acción</th></tr>
                </thead>
                <tbody id="tabla-vacantes-alumno"></tbody>
            </table>
        </div>
    `;
    cargarVacantesParaAlumno(tipoFiltro);
}

async function cargarVacantesParaAlumno(tipoFiltro) {
    const tabla = document.getElementById('tabla-vacantes-alumno');
    if (!tabla) return;
    try {
        const res = await fetch('/api/vacantes');
        const json = await res.json();
        let vacantes = json.data || [];

        // Filtramos usando la normalización
        if (tipoFiltro) {
            vacantes = vacantes.filter(v => normalizarTexto(v.tipo_proceso).includes(normalizarTexto(tipoFiltro)));
        }

        tabla.innerHTML = vacantes.length > 0 
            ? vacantes.map(v => `
                <tr>
                    <td>${v.tipo_proceso}</td>
                    <td>${v.nombre_empresa || 'N/A'}</td>
                    <td>${v.descripcion ? v.descripcion.substring(0, 50) : ''}...</td>
                    <td><button class="btn-primario" onclick="postularseAVacante(${v.id_vacante})">Postularse</button></td>
                </tr>
            `).join('')
            : `<tr><td colspan="4" style="text-align:center;">No hay vacantes disponibles para este proceso.</td></tr>`;
    } catch (error) {
        tabla.innerHTML = "<tr><td colspan='4' style='color:red;'>Error al cargar vacantes</td></tr>";
    }
}

// Redireccionamos a la función genérica con el nombre exacto
function renderServicioSection() { renderVacantesAlumnoSection('Servicio'); }
function renderPracticasSection() { renderVacantesAlumnoSection('Práctica'); }
function renderIntegrativaSection() { renderVacantesAlumnoSection('Integrativa'); }
function renderPerfilSection() { abrirModalPerfilAlumno(); }

function cargarSeccionAlumno(section) {
    const vistas = {
        'documentos': renderDocumentosSection,
        'servicio': renderServicioSection,
        'practicas': renderPracticasSection,
        'integrativa': renderIntegrativaSection,
        'perfil': renderPerfilSection
    };
    if (vistas[section]) vistas[section]();
}

// =====================================================
// 8. MODAL DE PERFIL DEL ALUMNO
// =====================================================
async function abrirModalPerfilAlumno() {
    try {
        const res = await fetch('/api/estudiantes/perfil');
        const resJson = await res.json();

        if (resJson.success && resJson.data) {
            const est = resJson.data;
            document.getElementById('perfil-id-estudiante').value = est.id_estudiante || '';
            document.getElementById('perfil-matricula').value = est.matricula || '';
            document.getElementById('perfil-carrera').value = est.carrera || '';
            document.getElementById('perfil-correo').value = est.correo || 'N/A';
            document.getElementById('perfil-nombre').value = est.nombre || '';
            document.getElementById('perfil-rfc').value = est.rfc || '';

            deshabilitarEdicionPerfilAlumno();
            document.getElementById('modal-perfil-alumno').style.display = 'flex';
        }
    } catch (error) {
        alert("Ocurrió un error al conectar con el servidor.");
    }
}

function habilitarEdicionPerfilAlumno() {
    document.getElementById('perfil-rfc').disabled = false;
    document.getElementById('perfil-nombre').disabled = false;
    document.getElementById('btn-editar-perfil-alumno').style.display = 'none';
    document.getElementById('btn-guardar-perfil-alumno').style.display = 'inline-block';
}

function deshabilitarEdicionPerfilAlumno() {
    document.getElementById('perfil-rfc').disabled = true;
    document.getElementById('perfil-nombre').disabled = true;
    document.getElementById('btn-editar-perfil-alumno').style.display = 'inline-block';
    document.getElementById('btn-guardar-perfil-alumno').style.display = 'none';
}

function cerrarModalPerfilAlumno() { document.getElementById('modal-perfil-alumno').style.display = 'none'; }

// =====================================================
// 9. INTERCEPCIÓN Y ENVÍO DE DOCUMENTOS (MULTER)
// =====================================================
function handleSubirDocumento(nombreDocumento) {
    const inputTemporal = document.getElementById('nombre-documento-temporal');
    if (inputTemporal) inputTemporal.value = nombreDocumento;

    const inputArchivoGlobal = document.getElementById('input-archivo-global');
    if (inputArchivoGlobal) {
        inputArchivoGlobal.value = ''; 
        inputArchivoGlobal.click();
    }
}

async function procesarArchivoSeleccionado(input) {
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    const nombreDocumento = document.getElementById('nombre-documento-temporal').value;

    if (!nombreDocumento) return alert("Error: No se identificó el documento a subir.");
    if (archivo.size > 5 * 1024 * 1024) return alert("El archivo excede el límite permitido de 5MB.");

    const formData = new FormData();
    formData.append('nombreDocumento', nombreDocumento); 
    formData.append('archivo', archivo);

    try {
        const respuesta = await fetch('/api/estudiantes/subir-documento', {
            method: 'POST',
            body: formData 
        });
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.success) {
            alert(`✅ ¡Excelente! Documento cargado con éxito.`);
            renderDocumentosSection();
        } else {
            alert(`❌ Error al subir: ${resultado.error || 'Inténtalo de nuevo'}`);
        }
    } catch (error) {
        alert("❌ Error de red: No se pudo conectar con el servidor.");
    }
}

async function postularseAVacante(idVacante) {
    try {
        const res = await fetch('/api/postulaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_vacante: idVacante,
                tipo_proceso: procesoAlumnoSeleccionado || 'Servicio'
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ Te has postulado correctamente");
            // Refresca la vista en la que nos encontremos
            cargarSeccionAlumno(document.querySelector('.sideMenu a.activo')?.getAttribute('data-section') || 'servicio');
        } else {
            alert("❌ Error: " + (data.error || 'No se pudo completar la postulación'));
        }
    } catch (error) {
        alert("Error al postularse");
    }
}

// =====================================================
// 10. FORM SUBMITS (SPA PERSISTENCIA)
// =====================================================
const formPerfilEmpresa = document.getElementById('form-perfil-empresa');
if (formPerfilEmpresa) {
    formPerfilEmpresa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nombre_empresa: document.getElementById('perfil-nombre').value,
            rfc: document.getElementById('perfil-rfc').value,
            correo: document.getElementById('perfil-correo').value,
            nombre: document.getElementById('perfil-contacto').value
        };

        try {
            const res = await fetch('/api/empresas/perfil', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Perfil actualizado correctamente");
                deshabilitarEdicion();
                cerrarModalPerfil();
            } else {
                const data = await res.json();
                alert(`Error al actualizar: ${data.mensaje || 'Error desconocido'}`);
            }
        } catch (error) {
            alert("Error al actualizar");
        }
    });
}

const formPerfilAlumno = document.getElementById('form-perfil-alumno');
if (formPerfilAlumno) {
    formPerfilAlumno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            rfc: document.getElementById('perfil-rfc').value.trim(),
            nombre: document.getElementById('perfil-nombre').value.trim()
        };

        try {
            const res = await fetch('/api/estudiantes/perfil', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("¡Perfil de estudiante actualizado con éxito!");
                deshabilitarEdicionPerfilAlumno();
                cerrarModalPerfilAlumno();
            } else {
                const data = await res.json();
                alert(`Error al actualizar perfil: ${data.mensaje}`);
            }
        } catch (error) {
            alert("Error técnico al guardar los cambios.");
        }
    });
}

// =====================================================
// 11. ROUTER INICIALIZADOR Y LÓGICA DE MENÚS
// =====================================================

// 👉 CORRECCIÓN: Validación a prueba de balas para mostrar/ocultar el menú
function ajustarMenuLateral(proceso) {
    if (!proceso) return;
    
    const normProceso = normalizarTexto(proceso);
    let seccionPermitida = '';

    // Determinamos el string interno basado en el dato normalizado de la BD
    if (normProceso.includes('servicio')) seccionPermitida = 'servicio';
    else if (normProceso.includes('practica')) seccionPermitida = 'practicas';
    else if (normProceso.includes('integrativa')) seccionPermitida = 'integrativa';

    const itemsMenu = document.querySelectorAll('.sideMenu a[data-section]');
    
    itemsMenu.forEach(item => {
        const section = item.getAttribute('data-section');
        
        if (['servicio', 'practicas', 'integrativa'].includes(section)) {
            // Solo mostramos la sección que coincide con el proceso del alumno
            if (section === seccionPermitida) {
                item.style.display = 'block'; 
            } else {
                item.style.display = 'none';  
            }
        } else {
            // Secciones globales como documentos o perfil se quedan
            item.style.display = 'block'; 
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Intentar precargar el proceso del alumno
    await verificarEstatusProcesoAlumno();

    // 2. Capturar clics de los menús
    const sideMenu = document.querySelector('.sideMenu');
    if (sideMenu) {
        sideMenu.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;

            const section = target.getAttribute('data-section');
            if (!section) return;

            e.preventDefault();

            // Gestiona el resaltado visual del menú
            sideMenu.querySelectorAll('a').forEach(a => a.classList.remove('activo'));
            target.classList.add('activo');

            // Enrutador
            if (window.location.href.includes('admin_view')) {
                cargarSeccionAdmin(section);
            } else if (window.location.href.includes('dashboardEmpresa')) {
                cargarSeccionEmpresa(section);
            } else if (window.location.href.includes('dashboardAlumno')) {
                cargarSeccionAlumno(section);
            }
        });
    }

    // 3. Cargas por defecto
    if (window.location.href.includes('admin_view')) {
        cargarSeccionAdmin('dashboard');
    } else if (window.location.href.includes('dashboardEmpresa')) {
        cargarSeccionEmpresa('solicitudes');
    } else if (window.location.href.includes('dashboardAlumno')) {
        cargarSeccionAlumno('documentos');
    }
});