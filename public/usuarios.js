async function cargarUsuarios() {
    const res = await fetch('/api/usuarios');
    const data = await res.json();

    let html = '';

    data.data.forEach(u => {
        html += `
            <tr>
                <td>${u.id_usuario}</td>
                <td>${u.correo}</td>
                <td>${u.rol}</td>
                <td>
                    <button onclick="eliminarUsuario(${u.id_usuario})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('tablaUsuarios').innerHTML = html;
}

async function crearUsuario() {
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;
    const rol = document.getElementById('rol').value;

    await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password, rol })
    });

    cargarUsuarios();
}

async function eliminarUsuario(id) {
    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    cargarUsuarios();
}
