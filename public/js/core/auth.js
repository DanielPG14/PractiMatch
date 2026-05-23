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

        const rutas = {
            'Admin': 'admin_view.html',
            'Estudiante': 'dashboardAlumno_view.html',
            'Empresa': 'dashboardEmpresa_view.html'
        };
        if (rutas[datos.rol]) window.location.href = `/html/${rutas[datos.rol]}`;
    } catch (error) {
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