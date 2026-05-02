async function cargarEmpresas() {
    const res = await fetch('/api/empresas');
    const data = await res.json();

    let html = '';

    data.data.forEach(e => {
        html += `
            <tr>
                <td>${e.id_empresa}</td>
                <td>${e.nombre_empresa}</td>
                <td>${e.estado}</td>
                <td>${e.rfc}</td>
                <td>
                    <button onclick="eliminarEmpresa(${e.id_empresa})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('tablaEmpresas').innerHTML = html;
}

async function crearEmpresa() {
    const id_usuario = document.getElementById('id_usuario').value;
    const nombre_empresa = document.getElementById('nombre_empresa').value;
    const estado = document.getElementById('estado').value;
    const rfc = document.getElementById('rfc').value;

    await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario, nombre_empresa, estado, rfc })
    });

    cargarEmpresas();
}

async function eliminarEmpresa(id) {
    await fetch(`/api/empresas/${id}`, { method: 'DELETE' });
    cargarEmpresas();
}
