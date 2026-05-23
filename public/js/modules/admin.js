// =====================================================
// MÓDULO DE ADMINISTRACIÓN - VERSIÓN CORREGIDA
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const sideMenu = document.querySelector('.sideMenu');

    if (sideMenu) {
        sideMenu.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;

            const section = target.getAttribute('data-section');
            if (!section) return;

            e.preventDefault();

            // Resaltado visual
            sideMenu.querySelectorAll('a').forEach(a => a.classList.remove('activo'));
            target.classList.add('activo');

            // Enrutador específico de Admin
            cargarSeccionAdmin(section);
        });
    }

    // Carga por defecto: Dashboard
    cargarSeccionAdmin('dashboard');
});

function cargarSeccionAdmin(section) {
    const vistas = {
        'dashboard': renderAdminDashboard,
        'usuarios': renderAdminUsuarios,
        'empresas': renderAdminEmpresas,
        'solicitudes': renderAdminSolicitudes, // Aprobación de vacantes
        'validar-documentos': renderAdminValidacion
    };
    if (vistas[section]) vistas[section]();
}

// --- RENDERIZADO DE SECCIONES ---

function renderAdminDashboard() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Panel de Control Global</h2>
      <p>Bienvenido, Administrador. Gestión integral del sistema PractiMatch.</p>
    </div>`;
}

function renderAdminUsuarios() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Gestión de Usuarios</h2>
      <div class="tabla-contenedor">
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Correo</th><th>RFC</th><th>Rol</th></tr>
            </thead>
            <tbody id="tabla-admin-usuarios"></tbody>
          </table>
      </div>
    </div>`;

    const rowUser = (u) => `<tr><td>${u.id_usuario}</td><td>${u.nombre}</td><td>${u.correo}</td><td>${u.rfc || 'N/A'}</td><td><span class="badge">${u.rol}</span></td></tr>`;
    cargarDatosTablaGenerica('/api/admin/usuarios', 'tabla-admin-usuarios', rowUser);
}

function renderAdminEmpresas() {
    document.getElementById('content-area').innerHTML = `
    <section class="panel-section">
      <h2>Gestión de Empresas</h2>
      <p class="section-subtitle">Revisa y aprueba el registro de empresas en el sistema.</p>
      <div class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Empresa</th>
              <th>RFC</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tabla-admin-empresas"></tbody>
        </table>
      </div>
    </section>`;

    const rowEmpresa = (empresa) => {
        let claseBadge = 'badge-pendiente';
        if (empresa.estado === 'Aprobado') claseBadge = 'badge-aprobado';
        if (empresa.estado === 'Rechazado') claseBadge = 'badge-rechazado';

        const estaGestionada = empresa.estado !== 'Pendiente';

        return `
        <tr>
            <td>${empresa.id_empresa}</td>
            <td><strong>${empresa.nombre_empresa}</strong></td>
            <td>${empresa.rfc || 'N/A'}</td>
            <td><span class="badge ${claseBadge}">${empresa.estado}</span></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    ${!estaGestionada ? `
                        <button class="btn-aceptar" onclick="gestionarEmpresa(${empresa.id_empresa}, 'Aprobado')">Aceptar</button>
                        <button class="btn-rechazar" onclick="gestionarEmpresa(${empresa.id_empresa}, 'Rechazado')">Rechazar</button>
                    ` : `<span style="color: gray; font-size: 0.85em;">Sin acciones pendientes</span>`}
                </div>
            </td>
        </tr>`;
    };
    cargarDatosTablaGenerica('/api/admin/empresas', 'tabla-admin-empresas', rowEmpresa, 'No hay empresas registradas.');
}

function renderAdminValidacion() {
    document.getElementById('content-area').innerHTML = `
    <section class="panel-section">
      <h2>Validación de Documentos Estudiantiles</h2>
      <p class="section-subtitle">Revisa y aprueba los archivos subidos por los alumnos.</p>
      <div class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Alumno / Matrícula</th>
              <th>Proceso</th>
              <th>Documento</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tabla-admin-documentos"></tbody>
        </table>
      </div>
    </section>`;

    const rowDocumento = (doc) => {
        let claseBadge = 'badge-pendiente';
        if (doc.estado === 'Aprobado') claseBadge = 'badge-aprobado';
        if (doc.estado === 'Rechazado') claseBadge = 'badge-rechazado';

        const estaGestionado = doc.estado !== 'Pendiente';
        
        // CORRECCIÓN: Limpiar la ruta para evitar el doble /uploads/
        // Esto elimina cualquier cantidad de "uploads/" al inicio para asegurar que solo haya uno
        const rutaLimpia = doc.ruta_archivo.replace(/\\/g, '/').replace(/^(\/?uploads\/)+/, '');

        return `
        <tr>
            <td>
                <strong>${doc.nombre_alumno || 'N/A'}</strong><br>
                <span style="font-size: 0.85em; color: gray;">Matrícula: ${doc.matricula || 'N/A'}</span>
            </td>
            <td>${doc.tipo_proceso || 'General'}</td>
            <td><strong>${doc.nombre_documento || 'Documento'}</strong></td>
            <td>${doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleDateString() : 'N/A'}</td>
            <td><span class="badge ${claseBadge}">${doc.estado || 'Pendiente'}</span></td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <a href="/uploads/${rutaLimpia}" target="_blank" class="btn-primario" style="text-decoration:none; text-align:center; padding: 4px 8px; font-size: 11px;">Ver Archivo</a>
                    ${!estaGestionado ? `
                        <div style="display: flex; gap: 4px;">
                            <button class="btn-aceptar" style="flex:1; padding: 4px;" onclick="cambiarEstadoDocumentoAdmin(${doc.id_documento}, 'Aprobado')">Aprobar</button>
                            <button class="btn-rechazar" style="flex:1; padding: 4px;" onclick="cambiarEstadoDocumentoAdmin(${doc.id_documento}, 'Rechazado')">Rechazar</button>
                        </div>
                    ` : ''}
                </div>
            </td>
        </tr>`;
    };

    cargarDatosTablaGenerica('/api/admin/documentos', 'tabla-admin-documentos', rowDocumento, 'No hay documentos cargados.');
}

function renderAdminSolicitudes() {
    document.getElementById('content-area').innerHTML = `
    <section class="panel-section">
      <h2>Aprobación de Vacantes</h2>
      <p class="section-subtitle">Revisa las vacantes publicadas por las empresas antes de que sean visibles para los alumnos.</p>
      <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Título de Vacante</th>
                <th>Modalidad</th>
                <th>Fecha Pub.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tabla-admin-vacantes"></tbody>
          </table>
      </div>
    </section>`;

    const rowVacante = (v) => {
        const estaGestionada = v.estado !== 'Pendiente';
        // CORRECCIÓN: Los estados de vacantes son Aprobado y Rechazado
        let claseBadge = v.estado === 'Aprobado' ? 'badge-aprobado' : (v.estado === 'Pendiente' ? 'badge-pendiente' : 'badge-rechazado');

        // CORRECCIÓN: Se agrega la celda de la modalidad (tipo_proceso) para igualar los 6 headers
        return `
    <tr>
        <td>
            <strong>${v.nombre_empresa}</strong><br>
            <span style="font-size:0.8em; color:gray;">${v.correo}</span>
        </td>
        <td>${v.titulo}</td>
        <td>${v.tipo_proceso || 'S/E'}</td> 
        <td>${v.fecha_creacion ? new Date(v.fecha_creacion).toLocaleDateString() : 'S/F'}</td>
        <td><span class="badge ${claseBadge}">${v.estado || 'Error'}</span></td>
        <td>
            <div style="display: flex; gap: 5px;">
                ${!estaGestionada ? `
                    <button class="btn-aceptar" onclick="gestionarVacante(${v.id_vacante}, 'Aprobado')">Aprobar</button>
                    <button class="btn-rechazar" onclick="gestionarVacante(${v.id_vacante}, 'Rechazado')">Rechazar</button>
                ` : `<span style="color: gray; font-size: 0.85em;">Gestionada</span>`}
            </div>
        </td>
    </tr>`;
    };

    cargarDatosTablaGenerica('/api/admin/vacantes', 'tabla-admin-vacantes', rowVacante, 'No hay vacantes para revisar.');
}

async function gestionarVacante(id, nuevoEstado) {
    const accion = nuevoEstado === 'Aprobado' ? 'APROBAR' : 'RECHAZAR';
    if (!confirm(`¿Estás seguro de que deseas ${accion} esta vacante?`)) return;

    try {
        const res = await fetch('/api/admin/vacantes/estatus', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_vacante: id, estado: nuevoEstado })
        });

        const data = await res.json();
        if (data.success) {
            renderAdminSolicitudes(); // Recargar la tabla
        } else {
            alert("Error al actualizar: " + data.error);
        }
    } catch (error) {
        console.error("Error en petición:", error);
    }
}

// --- ACCIONES (PUT/UPDATE) ---

async function gestionarEmpresa(idEmpresa, nuevoEstado) {
    if (!confirm(`¿Confirmas cambiar el estado a "${nuevoEstado}"?`)) return;

    try {
        const res = await fetch(`/api/admin/empresas/estatus`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_empresa: idEmpresa, estado: nuevoEstado })
        });
        const data = await res.json();
        if (data.success) {
            renderAdminEmpresas();
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function cambiarEstadoDocumentoAdmin(idDocumento, nuevoEstado) {
    let comentario = null;
    if (nuevoEstado === 'Rechazado') {
        comentario = prompt("Motivo del rechazo:");
        if (comentario === null) return;
        if (comentario.trim() === "") return alert("El motivo es obligatorio.");
    } else {
        if (!confirm("¿Aprobar este documento?")) return;
    }

    try {
        const res = await fetch('/api/admin/documentos/estado', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_documento: idDocumento, estado: nuevoEstado, comentario_rechazo: comentario })
        });
        const data = await res.json();
        if (data.success) {
            renderAdminValidacion();
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) {
        console.error(e);
    }
}