// 1. GESTIÓN DE SESIÓN Y AUTENTICACIÓN

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

let procesoAlumnoSeleccionado = null;
const PROCESOS_ALUMNO = {
    servicio: 'Servicio',
    practicas: 'Práctica',
    integrativa: 'Integrativa'
};

// 2. UTILIDADES DE RENDERIZADO (FRONTEND)

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

// 3. SECCIONES DINÁMICAS (DASHBOARD EMPRESA)

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

// 4. LÓGICA DE ENVÍO (BACKEND CONNECT)

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
        console.error("Error en la petición:", error);
        msg.innerHTML = "<p class='text-sm text-red-600'>❌ Error de conexión</p>";
    }
}

// 5. CONTROLADOR DE NAVEGACIÓN Y EVENTOS

function cargarSeccionEmpresa(section) {
    // Cargar contenido
    const vistas = {
        'requisitos': renderRequisitosSection,
        'solicitudes': renderSolicitudesSection,
        'becarios': renderBecariosSection
    };

    if (vistas[section]) vistas[section]();
}

// =====================================================
// NAVEGADOR INTELIGENTE UNIFICADO (SPA)
// =====================================================
// Un único listener que detecta la página y llama la función correcta
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.sideMenu a').forEach(link => {
        link.addEventListener('click', (e) => {
            // Capturar el data-section desde el enlace más cercano
            const linkElement = e.target.closest('a');
            if (!linkElement) return;
            
            const section = linkElement.dataset.section;
            if (!section) return;
            
            e.preventDefault();
            
            // Detectar la página actual y ejecutar la función correcta
            const path = window.location.pathname;
            let controllerFunction;
            
            if (path.includes('admin_view')) {
                controllerFunction = cargarSeccionAdmin;
            } else if (path.includes('dashboardEmpresa')) {
                controllerFunction = cargarSeccionEmpresa;
            } else if (path.includes('dashboardAlumno')) {
                controllerFunction = cargarSeccionAlumno;
            } else {
                return; // No ejecutar si no estamos en un dashboard conocido
            }
            
            // Actualizar clase .activo en el menú
            document.querySelectorAll('.sideMenu a').forEach(a => {
                a.classList.remove('activo');
            });
            linkElement.classList.add('activo');
            
            // Ejecutar el controlador específico
            controllerFunction(section);
        });
    });
});

function cargarSeccionAdmin(section) {
    // 2. Definir las vistas (Estaban fuera de la función)
    const vistas = {
        'dashboard': renderAdminDashboard,
        'alumnos': renderAdminUsuarios, // Cambiado de 'usuarios' a 'alumnos' para coincidir con el HTML
        'empresas-pendientes': renderAdminEmpresasPendientes,
        'solicitudes': renderAdminSolicitudes
    };

    if (vistas[section]) {
        vistas[section]();
    } else {
        console.warn("Sección no encontrada:", section);
    }
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

    // Función personalizada para filas de usuarios
    const rowUser = (u) => `<tr><td>${u.id_usuario}</td><td>${u.nombre}</td><td>${u.correo}</td><td>${u.rol}</td></tr>`;
    cargarDatosTablaGenerica('/api/admin/usuarios', 'tabla-admin-usuarios', rowUser);
}

// Nueva función de carga genérica para evitar errores
async function cargarDatosTablaGenerica(endpoint, tableBodyId, rowFn, msg = 'Sin datos') {
    const tabla = document.getElementById(tableBodyId);
    if (!tabla) return;
    try {
        const res = await fetch(endpoint);
        const json = await res.json();
        const lista = json.data || [];
        tabla.innerHTML = lista.length > 0 ? lista.map(rowFn).join('') : `<tr><td colspan="5">${msg}</td></tr>`;
    } catch (e) {
        tabla.innerHTML = "<tr><td colspan='5' style='color:red;'>Error al cargar datos</td></tr>";
    }
}

function renderAdminSolicitudes() {
    document.getElementById('content-area').innerHTML = `
    <div class="panel-section">
      <h2>Solicitudes Globales (Dashboard)</h2>
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Vacante</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody id="tabla-admin-dashboard"></tbody>
      </table>
    </div>`;

    // Definimos cómo se ve la fila para los datos del Admin
    const rowAdminDashboard = (p) => `
        <tr>
            <td>${p.correo}</td>
            <td>${p.vacante_titulo}</td>
            <td><span class="badge badge-revision">${p.estatus}</span></td>
        </tr>
    `;

    // USAMOS LA GENÉRICA
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
            renderAdminEmpresasPendientes(); // Recargamos la tabla para que desaparezca de "pendientes"
        }
    } catch (e) {
        console.error("Error al actualizar:", e);
    }
}

// 6. PERFIL DE EMPRESAS (POP UP)

async function cargarPerfilEmpresa() {
    try {
        const res = await fetch('/api/empresas/perfil');

        if (!res.ok) {
            const errorData = await res.json();
            alert(`⚠️ Error: ${errorData.mensaje || 'No se encontró el perfil de empresa'}`);
            return;
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
        console.error("Error crítico en el modal de empresa:", error);
        alert("No se pudo conectar con el servidor. Revisa la consola de Node.js");
    }
}

function abrirModalPerfil() {
    cargarPerfilEmpresa();
}

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

function cerrarModalPerfil() {
    document.getElementById('modal-perfil').style.display = 'none';
}

// =====================================================
// 7. SECCIONES DEL ALUMNO (DASHBOARD ESTUDIANTE)
// =====================================================

// Documentos iniciales - Vista por defecto
function renderDocumentosSection() {
    const proceso = procesoAlumnoSeleccionado;
    let titulo = 'Documentos Iniciales';
    let documentos = [
        { nombre: 'INE', estado: 'Aprobado' },
        { nombre: 'CURP', estado: 'Pendiente' },
        { nombre: 'Comprobante de domicilio', estado: 'Pendiente' },
        { nombre: 'Vigencia de seguro facultativo', estado: 'Pendiente' }
    ];
    let mensajeExtra = 'Selecciona un proceso para filtrar vacantes y adaptar los documentos requeridos.';

    if (proceso === 'Servicio') {
        titulo = 'Documentos requeridos para Servicio Social';
        documentos = [
            { nombre: 'Carta Presentación', estado: 'Pendiente' },
            { nombre: 'Carta Compromiso', estado: 'Pendiente' },
            { nombre: 'Constancia de Término', estado: 'Pendiente' }
        ];
        mensajeExtra = 'Para Servicio Social se requieren los documentos indicados. Súbelos cuando tengas todo listo.';
    } else if (proceso === 'Práctica' || proceso === 'Integrativa') {
        titulo = `Documentos requeridos para ${proceso}`;
        documentos = [
            { nombre: 'Carta Presentación', estado: 'Pendiente' },
            { nombre: 'Carta Compromiso', estado: 'Pendiente' },
            { nombre: 'Valoración', estado: 'Pendiente' },
            { nombre: 'Constancia de Término', estado: 'Pendiente' }
        ];
        mensajeExtra = `Para ${proceso} se requieren los documentos indicados. Súbelos cuando tengas todo listo.`;
    }

    const filas = documentos.map(doc => {
        const claseBadge = doc.estado === 'Aprobado' ? 'badge-aprobado' : 'badge-pendiente';
        return `
            <tr>
                <td>${doc.nombre}</td>
                <td><span class="badge ${claseBadge}">${doc.estado}</span></td>
                <td><button class="btn-subir" type="button" onclick="handleSubirDocumento('${doc.nombre}')">Subir</button></td>
            </tr>
        `;
    }).join('');

    document.getElementById('content-area').innerHTML = `
        <div class="panel-section">
            <h2>${titulo}</h2>
            <p class="info-adicional">${mensajeExtra}</p>
            <div class="tabla-contenedor">
                <table>
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Vacantes disponibles
function renderVacantesAlumnoSection() {
    const titulo = procesoAlumnoSeleccionado ? `Vacantes de ${procesoAlumnoSeleccionado}` : 'Vacantes Disponibles';
    const filtro = procesoAlumnoSeleccionado ? `<p class="info-adicional">Mostrando solo vacantes de ${procesoAlumnoSeleccionado}.</p>` : '';

    document.getElementById('content-area').innerHTML = `
        <div class="panel-section">
            <h2>${titulo}</h2>
            ${filtro}
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Empresa</th>
                        <th>Descripción</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="tabla-vacantes-alumno"></tbody>
            </table>
        </div>
    `;
    cargarVacantesParaAlumno();
}

async function cargarVacantesParaAlumno() {
    const tabla = document.getElementById('tabla-vacantes-alumno');
    try {
        const res = await fetch('/api/vacantes');
        const json = await res.json();
        let vacantes = json.data || [];

        if (procesoAlumnoSeleccionado) {
            vacantes = vacantes.filter(v => v.tipo_proceso === procesoAlumnoSeleccionado);
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
            : `<tr><td colspan="4" style="text-align:center;">No hay vacantes disponibles${procesoAlumnoSeleccionado ? ' para el proceso seleccionado' : ''}</td></tr>`;
    } catch (error) {
        tabla.innerHTML = "<tr><td colspan='4' style='color:red;'>Error al cargar vacantes</td></tr>";
    }
}

// Secciones próximamente
function renderServicioSection() {
    procesoAlumnoSeleccionado = 'Servicio';
    renderVacantesAlumnoSection();
}

function renderIntegrativaSection() {
    procesoAlumnoSeleccionado = 'Integrativa';
    renderVacantesAlumnoSection();
}

function renderPracticasSection() {
    procesoAlumnoSeleccionado = 'Práctica';
    renderVacantesAlumnoSection();
}

function renderPerfilSection() {
    abrirModalPerfilAlumno();
}

// Controlador de navegación del alumno
function cargarSeccionAlumno(section) {
    const vistas = {
        'documentos': renderDocumentosSection,
        'vacantes': renderVacantesAlumnoSection,
        'servicio': renderServicioSection,
        'integrativa': renderIntegrativaSection,
        'practicas': renderPracticasSection,
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

        // Verificamos que success sea true Y que existan los datos
        if (resJson.success && resJson.data) {
            const est = resJson.data;
            
            // Usamos verificaciones para evitar el error de "undefined"
            document.getElementById('perfil-id-estudiante').value = est.id_estudiante || '';
            document.getElementById('perfil-matricula').value = est.matricula || '';
            document.getElementById('perfil-carrera').value = est.carrera || '';
            document.getElementById('perfil-correo').value = est.correo || 'N/A';
            document.getElementById('perfil-nombre').value = est.nombre || '';
            document.getElementById('perfil-rfc').value = est.rfc || '';

            deshabilitarEdicionPerfilAlumno();
            document.getElementById('modal-perfil-alumno').style.display = 'flex';
        } else {
            // Si el backend responde pero dice que no hubo éxito
            alert("⚠️ No se encontraron datos para tu perfil de estudiante.");
            console.error("Respuesta del servidor:", resJson);
        }
    } catch (error) {
        console.error("Error al obtener perfil:", error);
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

function cerrarModalPerfilAlumno() {
    document.getElementById('modal-perfil-alumno').style.display = 'none';
}

// Funciones auxiliares del alumno
function handleSubirDocumento(nombreDocumento) {
    alert(`Funcionalidad de subida de ${nombreDocumento} próximamente`);
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
            cargarVacantesParaAlumno();
        } else {
            alert("❌ Error: " + (data.error || 'No se pudo completar la postulación'));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error al postularse");
    }
}

/*
// Guardar cambios
document.getElementById('form-perfil-empresa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nombre_empresa: document.getElementById('perfil-nombre').value,
        rfc: document.getElementById('perfil-rfc').value
    };

    try {
        const res = await fetch('/api/empresas/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Perfil actualizado correctamente");
            deshabilitarEdicion();
            cerrarModalPerfil();
        }
    } catch (error) {
        alert("Error al actualizar");
    }
});*/
// Guardar cambios - PROTEGIDO PARA SPA
const formPerfil = document.getElementById('form-perfil-empresa');

if (formPerfil) { // Solo se ejecuta si el formulario existe (Vista Empresa)
    formPerfil.addEventListener('submit', async (e) => {
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
                alert(`Error al actualizar: ${data.mensaje || data.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al actualizar perfil de empresa:', error);
            alert("Error al actualizar");
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('admin_view')) {
        cargarSeccionAdmin('dashboard');
    } 
    else if (path.includes('dashboardEmpresa')) {
        cargarSeccionEmpresa('requisitos');
    } 
    else if (path.includes('dashboardAlumno')) {
        cargarSeccionAlumno('documentos'); // Esto asegura que el alumno vea sus documentos
    }
});