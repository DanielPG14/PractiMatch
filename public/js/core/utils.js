// =====================================================
// UTILS.JS - FUNCIONES DE UTILIDAD GLOBAL
// =====================================================

// 1. UTILIDADES DE TEXTO Y FORMATO
const normalizarTexto = (texto) => {
    if (!texto) return '';
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const formatearFecha = (fecha) => {
    return fecha ? new Date(fecha).toLocaleDateString() : 'N/A';
};

// 2. GESTIÓN DE ESTADOS (BADGES)
// Centralizamos los colores de los estados para que sean consistentes en todo el sistema
const obtenerClaseBadge = (estatus) => {
    const clases = {
        'Aprobado': 'badge-aprobado',
        'Rechazado': 'badge-rechazado',
        'En proceso': 'badge-nuevo',
        'En revisión': 'badge-revision',
        'Finalizado': 'badge-finalizado',
        'Pendiente': 'badge-pendiente',
        'No subido': 'badge-nuevo'
    };
    return clases[estatus] || 'badge-pendiente';
};

// 3. RENDERIZADO DINÁMICO DE TABLAS
/**
 * Carga datos desde un API y los inyecta en un contenedor (tabla o div).
 * @param {string} endpoint - URL de la API
 * @param {string} containerId - ID del elemento HTML (tbody o div)
 * @param {function} rowFn - Función que retorna el HTML de la fila/card
 * @param {string} msgEmpty - Mensaje si no hay datos
 */
async function cargarDatosTablaGenerica(endpoint, containerId, rowFn, msgEmpty = 'Sin datos registrados') {
    const contenedor = document.getElementById(containerId);
    if (!contenedor) return;

    try {
        const res = await fetch(endpoint);
        const json = await res.json();
        const lista = json.data || [];

        if (lista.length > 0) {
            contenedor.innerHTML = lista.map(rowFn).join('');
        } else {
            // Si es un tbody, usamos una fila completa; si es un div, texto simple.
            const isTable = contenedor.tagName.toLowerCase() === 'tbody';
            contenedor.innerHTML = isTable 
                ? `<tr><td colspan="10" style="text-align:center;">${msgEmpty}</td></tr>`
                : `<p style="text-align:center; padding: 20px;">${msgEmpty}</p>`;
        }
    } catch (e) {
        console.error(`Error cargando datos de ${endpoint}:`, e);
        contenedor.innerHTML = "<tr><td colspan='10' style='color:red; text-align:center;'>Error al conectar con el servidor</td></tr>";
    }
}

// 4. LÓGICA DE MENÚS (COMPLEMENTO PARA ALUMNO.JS)
function ajustarMenuLateral(proceso) {
    if (!proceso) return;
    
    const normProceso = normalizarTexto(proceso);
    let seccionPermitida = '';

    if (normProceso.includes('servicio')) seccionPermitida = 'servicio';
    else if (normProceso.includes('practica')) seccionPermitida = 'practicas';
    else if (normProceso.includes('integrativa')) seccionPermitida = 'integrativa';

    const itemsMenu = document.querySelectorAll('.sideMenu a[data-section]');
    
    itemsMenu.forEach(item => {
        const section = item.getAttribute('data-section');
        
        // Secciones restringidas por tipo de proceso
        if (['servicio', 'practicas', 'integrativa'].includes(section)) {
            item.style.display = (section === seccionPermitida) ? 'block' : 'none';
        } else {
            // Secciones globales (Perfil, Documentos Iniciales) siempre visibles
            item.style.display = 'block'; 
        }
    });
}

// Variable global compartida para el estado del alumno
let procesoAlumnoSeleccionado = null;