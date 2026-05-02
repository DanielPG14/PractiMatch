async function cargarEstudiantes() {
    const res = await fetch('/api/estudiantes');
    const data = await res.json();

    let html = '';

    data.data.forEach(e => {
        html += `
            <tr>
                <td>${e.id_estudiante}</td>
                <td>${e.matricula}</td>
                <td>${e.carrera}</td>
                <td>${e.rfc}</td>
                <td>
                    <button onclick="eliminarEstudiante(${e.id_estudiante})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('tablaEstudiantes').innerHTML = html;
}

async function crearEstudiante() {
    const id_usuario = document.getElementById('id_usuario').value;
    const matricula = document.getElementById('matricula').value;
    const carrera = document.getElementById('carrera').value;
    const rfc = document.getElementById('rfc').value;

    await fetch('/api/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario, matricula, carrera, rfc })
    });

    cargarEstudiantes();
}

async function eliminarEstudiante(id) {
    await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' });
    cargarEstudiantes();
}
