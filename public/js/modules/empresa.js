// =====================================================
// MÓDULO DE EMPRESA - CORRECCIÓN ESTRUCTURA DB
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const sideMenu = document.querySelector('.sideMenu');
    if (sideMenu) {
        sideMenu.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target || target.getAttribute('onclick')) return;

            const section = target.getAttribute('data-section');
            if (!section) return;

            e.preventDefault();
            sideMenu.querySelectorAll('a').forEach(a => a.classList.remove('activo'));
            target.classList.add('activo');

            cargarSeccionEmpresa(section);
        });
    }
    cargarSeccionEmpresa('solicitudes');
});

function cargarSeccionEmpresa(section) {
    const vistas = {
        'requisitos': renderFormNuevaVacante,
        'solicitudes': renderEmpresaSolicitudes,
        'mis-vacantes': renderEmpresaVacantes,
        'becarios': renderEmpresaBecarios
    };
    if (vistas[section]) vistas[section]();
}

// --- SECCIÓN: SOLICITUDES ---
const rowSolicitud = (s) => {
    // Normalizamos el estatus para evitar errores de mayúsculas o espacios
    const estatusNormalizado = (s.estatus || '').trim().toLowerCase();

    // Definición de clases para el badge
    let claseBadge = 'badge-pendiente'; 
    if (estatusNormalizado === 'aprobado' || estatusNormalizado === 'aceptado') claseBadge = 'badge-aprobado';
    else if (estatusNormalizado === 'rechazado') claseBadge = 'badge-rechazado';
    else if (estatusNormalizado === 'en revisión' || estatusNormalizado === 'en revision') claseBadge = 'badge-revision'; 
    
    // CORRECCIÓN CLAVE: Habilitar si es 'en proceso', 'pendiente' o está vacío
    const requiereAccionEmpresa = (
        estatusNormalizado === 'en proceso' || 
        estatusNormalizado === 'pendiente' || 
        estatusNormalizado === ''
    );
    
    const cvRutaLimpia = s.cv_url ? s.cv_url.replace(/\\/g, '/').replace(/^(\/?uploads\/)+/, '') : null;

    return `
    <tr>
        <td><strong>${s.nombre_alumno || 'N/A'}</strong><br><small>${s.correo_alumno}</small></td>
        <td>${s.vacante_titulo || 'N/A'}</td>
        <td>
            ${cvRutaLimpia 
                ? `<a href="/uploads/${cvRutaLimpia}" target="_blank" class="btn-primario" style="padding: 5px 10px; font-size: 12px; text-decoration: none;">Ver CV</a>` 
                : '<span style="color:gray; font-size:11px;">Sin CV</span>'}
        </td>
        <td><span class="badge ${claseBadge}">${s.estatus}</span></td>
        <td>
            <div style="display: flex; gap: 5px;">
                <!-- Si requiereAccionEmpresa es falso, se añade el atributo disabled que causa el icono de prohibido -->
                <button class="btn-aceptar" 
                    ${!requiereAccionEmpresa ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} 
                    onclick="gestionarPostulacion(${s.id_postulacion}, 'En revisión')">Pre-Aceptar</button>
                
                <button class="btn-rechazar" 
                    ${!requiereAccionEmpresa ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} 
                    onclick="gestionarPostulacion(${s.id_postulacion}, 'Rechazado')">Rechazar</button>
            </div>
            ${estatusNormalizado === 'en revisión' || estatusNormalizado === 'en revision' 
                ? '<small style="display:block; margin-top:5px; color:#f39c12; font-size: 10px; font-weight:bold;">Esperando confirmación del alumno</small>' 
                : ''}
        </td>
    </tr>`;
};

function renderEmpresaSolicitudes() {
    document.getElementById('content-area').innerHTML = `
        <section class="panel-section">
            <h2>Candidatos Postulados</h2>
            <div class="tabla-contenedor">
                <table>
                    <thead>
                        <tr>
                            <th>Alumno</th>
                            <th>Vacante</th>
                            <th>CV</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-empresa-solicitudes"></tbody>
                </table>
            </div>
        </section>`;
    
    // Aquí usamos la constante rowSolicitud que ya definiste arriba
    cargarDatosTablaGenerica('/api/empresa/postulaciones', 'tabla-empresa-solicitudes', rowSolicitud, 'No hay postulaciones nuevas.');
}

async function gestionarPostulacion(id_postulacion, estado) {
    if (!confirm(`¿Seguro que deseas marcar la postulación como: ${estado}?`)) return;

    try {
        const res = await fetch('/api/empresa/responder-postulacion', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_postulacion, estado }) // estado será 'En revisión' o 'Rechazado'
        });
        const result = await res.json();
        
        if (result.success) {
            alert(result.mensaje);
            renderEmpresaSolicitudes(); // Recargar la tabla
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        console.error("Error al actualizar la postulación:", error);
    }
}

// --- SECCIÓN: NUEVA VACANTE (ACTUALIZADA CON TIPO_PROCESO) ---
function renderFormNuevaVacante() {
    document.getElementById('content-area').innerHTML = `
        <section class="panel-section">
            <h2>Publicar Nueva Vacante</h2>
            <form id="form-nueva-vacante" class="form-section">
                <div class="campo">
                    <label>Título de la Vacante</label>
                    <input type="text" id="vacante-titulo" placeholder="Ej. Desarrollador Backend" required>
                </div>
                <div class="campo">
                    <label>Ubicación</label>
                    <input type="text" id="vacante-ubicacion" placeholder="Ej. Remoto / Ciudad" required>
                </div>
                <div class="campo">
                    <label>Tipo de Proceso</label>
                    <select id="vacante-tipo-proceso" required>
                        <option value="Servicio">Servicio Social</option>
                        <option value="Práctica">Práctica Profesional</option>
                        <option value="Integrativa">Integrativa Profesional</option>
                    </select>
                </div>
                <div class="campo">
                    <label>Descripción</label>
                    <textarea id="vacante-descripcion" rows="4" required></textarea>
                </div>
                <div class="campo">
                    <label>Requisitos</label>
                    <textarea id="vacante-requisitos" rows="4" required></textarea>
                </div>
                <div class="form-footer">
                    <button type="submit" id="btn-publicar-vacante" class="btn-primario">Publicar</button>
                </div>
            </form>
        </section>`;
    document.getElementById('form-nueva-vacante').addEventListener('submit', guardarNuevaVacante);
}

async function guardarNuevaVacante(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-publicar-vacante');
    if(btn) btn.disabled = true;

    const data = {
        titulo: document.getElementById('vacante-titulo').value,
        ubicacion: document.getElementById('vacante-ubicacion').value,
        tipo_proceso: document.getElementById('vacante-tipo-proceso').value, // Nuevo campo según imagen
        descripcion: document.getElementById('vacante-descripcion').value,
        requisitos: document.getElementById('vacante-requisitos').value
    };

    try {
        const res = await fetch('/api/empresa/vacantes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert('Vacante publicada');
            renderEmpresaVacantes();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) { console.error(error); }
    finally { if(btn) btn.disabled = false; }
}

// --- SECCIÓN: MIS VACANTES (CORREGIDO FECHA_CREACION) ---
function renderEmpresaVacantes() {
    document.getElementById('content-area').innerHTML = `
        <section class="panel-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Mis Vacantes</h2>
            </div>
            <div class="tabla-contenedor">
                <table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Ubicación</th>
                            <th>Tipo</th>
                            <th>Fecha Creación</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-mis-vacantes"></tbody>
                </table>
            </div>
        </section>`;

    const rowV = (v) => `
        <tr>
            <td><strong>${v.titulo}</strong></td>
            <td>${v.ubicacion || 'No especificada'}</td>
            <td><span class="badge badge-pendiente">${v.tipo_proceso}</span></td>
            <td>${v.fecha_creacion ? new Date(v.fecha_creacion).toLocaleDateString() : 'N/A'}</td>
            <td><span class="badge">${v.estado}</span></td>
        </tr>`;
    
    cargarDatosTablaGenerica('/api/empresa/vacantes', 'tabla-mis-vacantes', rowV, 'No hay vacantes.');
}

// --- SECCIÓN: BECARIOS ---
function renderEmpresaBecarios() {
    document.getElementById('content-area').innerHTML = `
        <section class="panel-section">
            <h2>Mis Becarios</h2>
            <div class="tabla-contenedor">
                <table>
                    <thead>
                        <tr><th>Nombre</th><th>Carrera</th><th>Documentos</th></tr>
                    </thead>
                    <tbody id="tabla-empresa-becarios"></tbody>
                </table>
            </div>
        </section>`;

    const rowBecario = (b) => `
        <tr>
            <td><strong>${b.nombre_becario}</strong></td>
            <td>${b.carrera}</td>
            <td>
                ${b.cv_url ? `<a href="/uploads/${b.cv_url}" target="_blank" class="btn-primario" style="font-size:11px; padding:4px 8px;">CV</a>` : ''}
                ${b.seguro_url ? `<a href="/uploads/${b.seguro_url}" target="_blank" class="btn-primario" style="background:#27ae60; font-size:11px; padding:4px 8px;">Seguro</a>` : ''}
            </td>
        </tr>`;
    cargarDatosTablaGenerica('/api/empresa/becarios', 'tabla-empresa-becarios', rowBecario, 'Sin becarios activos.');
}

// --- PERFIL ---
async function abrirModalPerfil() {
    try {
        const res = await fetch('/api/empresa/perfil');
        const json = await res.json();
        if (json.success) {
            const d = json.data;
            document.getElementById('perfil-nombre').value = d.nombre_empresa || '';
            document.getElementById('perfil-rfc').value = d.rfc || '';
            document.getElementById('perfil-correo').value = d.correo || '';
            document.getElementById('modal-perfil').style.display = 'flex';
        }
    } catch (error) { console.error(error); }
}

function cerrarModalPerfil() {
    document.getElementById('modal-perfil').style.display = 'none';
    habilitarEdicion(false);
}

function habilitarEdicion(h) {
    ['perfil-nombre', 'perfil-rfc', 'perfil-correo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !h;
    });
    document.getElementById('btn-editar-activar').style.display = h ? 'none' : 'inline-block';
    document.getElementById('btn-guardar-perfil').style.display = h ? 'inline-block' : 'none';
}

// --- UTILIDADES ---
async function cargarDatosTablaGenerica(url, targetId, rowTemplate, emptyMsg) {
    const tbody = document.getElementById(targetId);
    if (!tbody) return;
    try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
            tbody.innerHTML = json.data.map(rowTemplate).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px;">${emptyMsg}</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:red;">Error de carga.</td></tr>`;
    }
}