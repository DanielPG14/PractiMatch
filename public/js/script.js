// 1. GESTIÓN DE SESIÓN Y AUTENTICACIÓN

async function iniciarSesion() {
  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();

  try {
    const respuesta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) return alert(datos.mensaje);

    // Redirección por roles
    const rutas = { 'Admin': 'admin_view.html', 'Estudiante': 'dashboardAlumno_view.html', 'Empresa': 'dashboardEmpresa_view.html' };
    if (rutas[datos.rol]) window.location.href = `/html/${rutas[datos.rol]}`;

  } catch (error) {
    console.error("Error login:", error);
    alert("Error al conectar con el servidor");
  }
}

async function cerrarSesion() {
  try {
    const respuesta = await fetch('/api/auth/logout', { method: 'POST' });
    if (respuesta.ok) window.location.href = '/html/login_view.html';
  } catch (error) {
    console.error("Error logout:", error);
  }
}

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
    <div class="panel-section">
      <h2>Publicar Nueva Vacante</h2>
      <form id="vacante-form" class="form-section">
        <label>Tipo de Proceso</label>
        <select id="tipo-proceso" required>
            <option value="Servicio">Servicio Social</option>
            <option value="Practica">Práctica Profesional</option>
            <option value="Integrativa">Integrativa Profesional</option>
        </select>

        <label>Descripción detallada</label>
        <textarea id="vacante-descripcion" rows="5" required placeholder="Describe las tareas..."></textarea>

        <button type="submit" class="btn-primario">Crear Vacante</button>
      </form>
      <div id="vacante-message"></div>
    </div>
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

  // Construimos el objeto SIN el campo 'titulo'
  const payload = {
    tipo_proceso: document.getElementById('tipo-proceso').value,
    descripcion: document.getElementById('vacante-descripcion').value.trim()
  };

  try {
    const res = await fetch('/api/vacantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const datos = await res.json();

    if (res.ok) {
      msg.innerHTML = "<p style='color:green;'>✅ Vacante guardada correctamente</p>";
      e.target.reset();
      setTimeout(() => cargarSeccionEmpresa('solicitudes'), 2000);
    } else {
      // Aquí verás el error detallado si algo falla
      msg.innerHTML = `<p style='color:red;'>❌ ${datos.error || 'Error al guardar'}</p>`;
    }
  } catch (error) {
    console.error("Error en la petición:", error);
  }
}

// 5. CONTROLADOR DE NAVEGACIÓN Y EVENTOS

function cargarSeccionEmpresa(section) {
  // Actualizar clases activas en el menú
  document.querySelectorAll('.sideMenu a').forEach(a => {
    a.classList.toggle('activo', a.dataset.section === section);
  });

  // Cargar contenido
  const vistas = {
    'requisitos': renderRequisitosSection,
    'solicitudes': renderSolicitudesSection,
    'becarios': renderBecariosSection
  };
  
  if (vistas[section]) vistas[section]();
}

// Listeners de clics en el menú
document.querySelectorAll('.sideMenu a').forEach(link => {
  link.addEventListener('click', (e) => {
    const sec = e.target.closest('a').dataset.section;
    if (sec) {
      e.preventDefault();
      cargarSeccionEmpresa(sec);
    }
  });
});

// Carga inicial
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('content-area')) {
    cargarSeccionEmpresa('requisitos');
  }
});

// 6. PERFIL DE EMPRESAS (POP UP)

async function abrirModalPerfil() {
    try {
        const res = await fetch('/api/empresas/perfil');
        const resJson = await res.json();

        if (resJson.success) {
            const emp = resJson.data;
            document.getElementById('perfil-nombre').value = emp.nombre_empresa;
            document.getElementById('perfil-rfc').value = emp.rfc || '';
            
            const estadoBadge = document.getElementById('perfil-estado');
            estadoBadge.textContent = emp.estado;
            estadoBadge.className = `badge badge-${emp.estado.toLowerCase()}`;

            // Resetear estado del modal
            deshabilitarEdicion();
            document.getElementById('modal-perfil').style.display = 'flex';
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function habilitarEdicion() {
    document.getElementById('perfil-nombre').disabled = false;
    document.getElementById('perfil-rfc').disabled = false;
    document.getElementById('btn-editar-activar').style.display = 'none';
    document.getElementById('btn-guardar-perfil').style.display = 'inline-block';
}

function deshabilitarEdicion() {
    document.getElementById('perfil-nombre').disabled = true;
    document.getElementById('perfil-rfc').disabled = true;
    document.getElementById('btn-editar-activar').style.display = 'inline-block';
    document.getElementById('btn-guardar-perfil').style.display = 'none';
}

function cerrarModalPerfil() {
    document.getElementById('modal-perfil').style.display = 'none';
}

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
});