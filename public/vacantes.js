async function cargarVacantes() {
    const res = await fetch('/api/vacantes');
    const data = await res.json();

    let html = '';

    data.data.forEach(v => {
        html += `
            <tr>
                <td>${v.id_vacante}</td>
                <td>${v.tipo_proceso}</td>
                <td>${v.descripcion}</td>
                <td>${v.fecha_creacion}</td>
                <td>
                    <button onclick="eliminarVacante(${v.id_vacante})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('tablaVacantes').innerHTML = html;
}

async function crearVacante() {
    const id_empresa = document.getElementById('id_empresa').value;
    const tipo_proceso = document.getElementById('tipo_proceso').value;
    const descripcion = document.getElementById('descripcion').value;
    const fecha_creacion = document.getElementById('fecha_creacion').value;

    await fetch('/api/vacantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_empresa, tipo_proceso, descripcion, fecha_creacion })
    });

    cargarVacantes();
}

async function eliminarVacante(id) {
    await fetch(`/api/vacantes/${id}`, { method: 'DELETE' });
    cargarVacantes();
}
