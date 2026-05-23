window.AppAlumno = {
    estado: 1,
    tipoProceso: '',

    init: async function() {
        await this.cargarDatosBase();
        this.configurarInterceptor();
        this.inyectarHTMLModal(); // Inyectamos el modal al iniciar
        this.navegar('documentos');
    },

    configurarInterceptor: function() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-section]');
            if (!link) return;

            const section = link.getAttribute('data-section');
            
            if (section === 'vacantes' && this.estado < 2) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Primero debes completar y aprobar todos tus documentos para acceder a la sección de vacantes.");
                return false; 
            }

            e.preventDefault();
            this.navegar(section);
        }, true); 
    },

    navegar: function(seccion) {
        document.querySelectorAll('.sideMenu a').forEach(el => el.classList.remove('activo'));
        const activeLink = document.querySelector(`.sideMenu a[data-section="${seccion}"]`);
        if (activeLink) activeLink.classList.add('activo');

        switch(seccion) {
            case 'documentos': this.renderDocumentos(); break;
            case 'perfil': this.renderPerfil(); break;
            case 'vacantes': this.renderVacantes(); break;
            case 'servicio':
            case 'practicas':
            case 'integrativa': this.renderDetalleProceso(); break;
        }
    },

    cargarDatosBase: async function() {
        try {
            const resEst = await fetch('/api/estudiantes/estado-proceso');
            const dataEst = await resEst.json();
            if (dataEst.success) this.estado = dataEst.estado;

            const resPerf = await fetch('/api/estudiantes/perfil');
            const dataPerf = await resPerf.json();
            if (dataPerf.success) {
                this.tipoProceso = dataPerf.data.tipo_proceso;
                this.filtrarMenu();
            }
        } catch (e) { console.error("Error base:", e); }
    },

    filtrarMenu: function() {
        const mapa = { 'Servicio': 'servicio', 'Práctica': 'practicas', 'Integrativa': 'integrativa' };
        const seccionValida = mapa[this.tipoProceso];
        
        document.querySelectorAll('.sideMenu a[data-section]').forEach(link => {
            const sec = link.getAttribute('data-section');
            if (['servicio', 'practicas', 'integrativa'].includes(sec)) {
                link.style.display = (sec === seccionValida) ? 'block' : 'none';
            }
        });
    },

    renderPerfil: async function() {
        const cont = document.getElementById('content-area');
        cont.innerHTML = `<h2>Cargando perfil...</h2>`;
        
        try {
            const res = await fetch('/api/estudiantes/perfil');
            const json = await res.json();
            const p = json.data;
            
            cont.innerHTML = `
                <div class="panel-section">
                    <h2>Mi Perfil</h2>
                    <form class="form-section">
                        <div class="campo">
                            <label>Nombre Completo</label>
                            <input type="text" value="${p.nombre || ''}" disabled>
                        </div>
                        <div class="campo">
                            <label>Matrícula</label>
                            <input type="text" value="${p.matricula || ''}" disabled>
                        </div>
                        <div class="campo">
                            <label>Correo Electrónico</label>
                            <input type="email" id="input-correo" value="${p.correo || ''}">
                        </div>
                        <div class="form-footer">
                            <button type="button" class="btn-primario" onclick="AppAlumno.guardarPerfil()">Guardar Cambios</button>
                        </div>
                    </form>
                </div>`;
        } catch (e) { cont.innerHTML = `<p>Error al cargar el perfil.</p>`; }
    },

    guardarPerfil: async function() {
        const nuevoCorreo = document.getElementById('input-correo').value;
        const res = await fetch('/api/estudiantes/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: nuevoCorreo })
        });
        const result = await res.json();
        if(result.success) alert("Perfil actualizado");
        else alert(result.mensaje || "Error al actualizar");
    },

    renderVacantes: function() {
        document.getElementById('content-area').innerHTML = `
            <div class="panel-section">
                <h2>Vacantes Disponibles</h2>
                <p>Listado de vacantes para ${this.tipoProceso}...</p>
            </div>`;
    },

    renderDetalleProceso: function() {
        document.getElementById('content-area').innerHTML = `
            <div class="panel-section">
                <h2>Seguimiento de ${this.tipoProceso}</h2>
                <div class="progress-tracker">
                    <div class="progress-steps ${this.estado > 0 ? 'active' : ''}">
                        ${this.generarHTMLPasos()}
                    </div>
                </div>
            </div>`;
    },

    renderDocumentos: async function() {
        document.getElementById('content-area').innerHTML = `
            <div class="panel-section">
                <h2>Gestión de Documentos</h2>
                <p class="section-subtitle">Asegúrate de tener todos tus documentos validados.</p>
                <div class="tabla-contenedor">
                    <table>
                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="body-docs"></tbody>
                    </table>
                </div>
            </div>`;
        this.actualizarTablaDocumentos();
    },

    actualizarTablaDocumentos: async function() {
        const docsBase = ['INE', 'CURP', 'Constancia de Estudios', 'Seguro Facultativo', 'Curriculum Vitae (CV)'];
        try {
            const res = await fetch('/api/estudiantes/mis-documentos');
            const json = await res.json();
            const subidos = json.data || [];
            document.getElementById('body-docs').innerHTML = docsBase.map(nombre => {
                const doc = subidos.find(d => d.nombre_documento === nombre);
                const est = doc ? doc.estado : 'Sin actualizar';
                const claseBadge = doc ? `badge-${est.toLowerCase().replace(/ /g, '-')}` : 'badge-sin-actualizacion';
                return `
                    <tr>
                        <td><strong>${nombre}</strong></td>
                        <td><span class="badge ${claseBadge}">${est}</span></td>
                        <td><button onclick="AppAlumno.subirDoc('${nombre}')" class="btn-subir" id="btn-${nombre.replace(/ /g, '')}">${doc ? 'Actualizar' : 'Subir'}</button></td>
                    </tr>`;
            }).join('');
        } catch (e) { console.error(e); }
    },

    subirDoc: function(nombre) {
        const input = document.createElement('input');
        input.type = 'file';
        // Limitar extensiones permitidas
        input.accept = '.pdf,.jpg,.jpeg,.png'; 
        
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            // Validación de tamaño (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("El archivo es demasiado grande. El límite es de 5MB.");
                return;
            }

            const btn = document.getElementById(`btn-${nombre.replace(/ /g, '')}`);
            const textoOriginal = btn ? btn.innerText : 'Subir';
            if (btn) btn.innerText = "Subiendo...";

            const formData = new FormData();
            // IMPORTANTE: El texto debe ir ANTES que el archivo en Multer
            formData.append('nombreDocumento', nombre); 
            formData.append('archivo', file);
            
            try {
                const res = await fetch('/api/estudiantes/subir-documento', { 
                    method: 'POST', 
                    body: formData 
                });
                
                const json = await res.json();
                
                if (res.ok && json.success) { 
                    this.actualizarTablaDocumentos(); 
                    this.cargarDatosBase(); 
                    alert("Documento subido correctamente.");
                } else {
                    alert(`Error: ${json.error || 'No se pudo subir el documento'}`);
                }
            } catch (error) {
                alert("Error de conexión al subir el documento.");
            } finally {
                if (btn) btn.innerText = textoOriginal;
            }
        };
        input.click();
    },

    generarHTMLPasos: function() {
        const pasos = [{id: 1, t: 'Validación'}, {id: 2, t: 'Vacante'}, {id: 3, t: 'En Proceso'}, {id: 4, t: 'Finalizado'}, {id: 5, t: 'Confirmación'}];
        return pasos.map(p => {
            let status = '';
            if (p.id < this.estado) status = 'completed';
            else if (p.id === this.estado) status = 'active';
            
            return `
                <div class="progress-step ${status}">
                    <div class="progress-marker">${p.id < this.estado ? '✓' : p.id}</div>
                    <div class="progress-label">${p.t}</div>
                </div>`;
        }).join('');
    },

    // --- NUEVO: RENDERIZAR VACANTES ---
    renderVacantes: async function() {
        const cont = document.getElementById('content-area');
        cont.innerHTML = `
            <div class="panel-section">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>Vacantes de ${this.tipoProceso}</h2>
                    <button class="btn-primario" onclick="AppAlumno.abrirNotificaciones()" style="background-color: #3498db;">
                        Mis Postulaciones
                    </button>
                </div>
                <div id="lista-vacantes" style="display: grid; gap: 15px; margin-top: 20px;">Cargando vacantes...</div>
            </div>`;
            
        try {
            const res = await fetch('/api/estudiantes/vacantes');
            const json = await res.json();
            const contVacantes = document.getElementById('lista-vacantes');
            
            if (json.success && json.data.length > 0) {
                contVacantes.innerHTML = json.data.map(v => `
                    <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fff;">
                        <h3 style="margin-top: 0; color: #2c3e50;">${v.titulo}</h3>
                        <p><strong>Empresa:</strong> ${v.nombre_empresa} | <strong>Ubicación:</strong> ${v.ubicacion}</p>
                        <p style="font-size: 14px; color: #555;">${v.descripcion}</p>
                        <p style="font-size: 13px;"><strong>Requisitos:</strong> ${v.requisitos}</p>
                        <button onclick="AppAlumno.aplicarVacante(${v.id_vacante})" class="btn-primario">Postularme</button>
                    </div>
                `).join('');
            } else {
                contVacantes.innerHTML = '<p>No hay vacantes nuevas disponibles para tu proceso en este momento.</p>';
            }
        } catch (e) {
            console.error("Error al cargar vacantes", e);
        }
    },

    aplicarVacante: async function(id_vacante) {
        if(!confirm('¿Estás seguro de postularte a esta vacante?')) return;
        
        try {
            const res = await fetch('/api/estudiantes/postular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_vacante })
            });
            const json = await res.json();
            
            if (json.success) {
                alert("Postulación enviada exitosamente. La empresa la revisará pronto.");
                this.renderVacantes(); // Refrescar lista para quitar a la que ya aplicó
            } else {
                alert("Error: " + json.error);
            }
        } catch (error) {
            console.error(error);
        }
    },

    // --- NUEVO: MODAL DE NOTIFICACIONES ---
    inyectarHTMLModal: function() {
        if (document.getElementById('modal-notificaciones')) return;
        const modalHTML = `
            <div id="modal-notificaciones" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
                <div style="background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
                        <h3 style="margin: 0;">Mis Postulaciones</h3>
                        <button onclick="AppAlumno.cerrarNotificaciones()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
                    </div>
                    <div id="contenido-notificaciones"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    abrirNotificaciones: async function() {
        document.getElementById('modal-notificaciones').style.display = 'flex';
        const contenedor = document.getElementById('contenido-notificaciones');
        contenedor.innerHTML = '<p>Cargando tus postulaciones...</p>';

        try {
            const res = await fetch('/api/estudiantes/mis-postulaciones');
            const json = await res.json();

            if (json.success && json.data.length > 0) {
                contenedor.innerHTML = json.data.map(p => {
                    let accionesHTML = '';
                    let badgeColor = '#95a5a6'; // Default gris para En proceso
                    
                    if (p.estatus === 'Aprobado') badgeColor = '#27ae60';
                    if (p.estatus === 'Rechazado') badgeColor = '#e74c3c';
                    if (p.estatus === 'En revisión') {
                        badgeColor = '#f39c12'; // Naranja para pre-aceptado
                        accionesHTML = `
                            <div style="margin-top: 10px; display: flex; gap: 10px;">
                                <button class="btn-primario" style="background-color: #27ae60;" onclick="AppAlumno.responderVacante(${p.id_postulacion}, 'Aprobado')">Aceptar Empresa</button>
                                <button class="btn-rechazar" style="background-color: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;" onclick="AppAlumno.responderVacante(${p.id_postulacion}, 'Rechazado')">Declinar</button>
                            </div>
                            <small style="color: #666; display: block; margin-top: 5px;">* La empresa te ha pre-aceptado. Confirma si deseas quedarte aquí.</small>
                        `;
                    }

                    return `
                        <div style="border-left: 4px solid ${badgeColor}; padding: 10px 15px; background: #f9f9f9; margin-bottom: 10px; border-radius: 4px;">
                            <h4 style="margin: 0 0 5px 0;">${p.titulo} <span style="font-size: 12px; font-weight: normal; background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 10px; float: right;">${p.estatus}</span></h4>
                            <p style="margin: 0; font-size: 14px; color: #555;">Empresa: <strong>${p.nombre_empresa}</strong></p>
                            <p style="margin: 0; font-size: 12px; color: #888;">Aplicado el: ${new Date(p.fecha_postulacion).toLocaleDateString()}</p>
                            ${accionesHTML}
                        </div>
                    `;
                }).join('');
            } else {
                contenedor.innerHTML = '<p>Aún no te has postulado a ninguna vacante.</p>';
            }
        } catch (e) {
            contenedor.innerHTML = '<p>Error al cargar las notificaciones.</p>';
        }
    },

    cerrarNotificaciones: function() {
        document.getElementById('modal-notificaciones').style.display = 'none';
    },

    responderVacante: async function(id_postulacion, respuesta) {
        if (!confirm(`¿Estás seguro de que deseas ${respuesta === 'Aprobado' ? 'ACEPTAR' : 'RECHAZAR'} esta vacante?`)) return;

        try {
            const res = await fetch('/api/estudiantes/responder-postulacion', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_postulacion, respuesta })
            });
            const json = await res.json();
            
            if (json.success) {
                alert("Respuesta guardada.");
                this.abrirNotificaciones(); // Recarga la lista
                // Opcionalmente actualizar el estado general del alumno a "Finalizado" (estado 4 o 5) si aceptó.
                if (respuesta === 'Aprobado') this.cargarDatosBase(); 
            }
        } catch (error) { console.error(error); }
    }
};

document.addEventListener('DOMContentLoaded', () => AppAlumno.init());