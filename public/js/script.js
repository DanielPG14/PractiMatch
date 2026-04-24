function mostrarTab(tab) {
  // Oculta ambos formularios
  document.getElementById("form-login").style.display = "none";
  document.getElementById("form-registro").style.display = "none";

  // Quita la clase activo de todos los tabs
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("activo"));

  // Muestra el formulario correcto y marca el tab
  if (tab === "login") {
    document.getElementById("form-login").style.display = "block";
    document.querySelectorAll(".tab")[0].classList.add("activo");
  } else {
    document.getElementById("form-registro").style.display = "block";
    document.querySelectorAll(".tab")[1].classList.add("activo");
  }
}

// función para manejar el inicio de sesión
async function iniciarSesion() {
    const correo = document.getElementById("correo").value.trim(); //Toma el valor del correo y elimina espacios
    const contrasena = document.getElementById("contrasena").value.trim(); //Toma el valor de la contraseña y elimina espacios

    try { // Enviar datos al backend
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        // Obtener respuesta del backend
        const datos = await respuesta.json();
        // Si no es exitoso, mostrar mensaje de error
        if (!respuesta.ok) {
            alert(datos.mensaje);
            return;
        }

        // Redirigir según rol
        if (datos.rol === 'Admin') {
            window.location.href = '/html/admin_view.html';
        } else if (datos.rol === 'Estudiante') {
            window.location.href = '/html/dashboardAlumno_view.html';
        } else if (datos.rol === 'Empresa') {
            window.location.href = '/html/dashboardEmpresa_view.html';
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error al conectar con el servidor");
    }
}

document.querySelectorAll(".sideMenu a").forEach(link => {
    link.addEventListener("click", function() {
        document.querySelectorAll(".sideMenu a").forEach(a => a.classList.remove("activo"));
        this.classList.add("activo");
    });
});

async function registrar() {
    const correo = document.getElementById("correo-reg").value.trim();
    const contrasena = document.getElementById("contrasena-reg").value.trim();
    const rol = document.getElementById("rol").value;
    try {
        const respuesta = await fetch('/api/auth/registro',{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena, rol })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            alert(datos.mensaje);
            return;
        }
        alert("Usuario registrado exitosamente");
        window.location.href = '/html/login_view.html';
    } catch (error) {
        console.error("Error:", error);
        alert("Error al conectar con el servidor");
    }
}

async function cerrarSesion() {
    try {
        const respuesta = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        const datos = await respuesta.json();
        if (respuesta.ok) {
            window.location.href = '/html/login_view.html';
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function cargarPostulaciones() {
    const tabla = document.getElementById('cuerpo-tabla');
    if (!tabla) return; // Si no estamos en la página de la tabla, no hacemos nada

    try {
        const response = await fetch('/api/postulaciones/listar');
        const data = await response.json();

        tabla.innerHTML = ""; // Limpiamos los datos estáticos

        data.forEach(p => {
            const row = document.createElement('tr');

            // Lógica para que los colores de los badges sigan funcionando
            let claseBadge = "badge-pendiente";
            if (p.estatus === 'Aprobado') claseBadge = "badge-aprobado";
            if (p.estatus === 'Rechazado') claseBadge = "badge-rechazado";
            if (p.estatus === 'En proceso') claseBadge = "badge-nuevo";

            row.innerHTML = `
                <td>Empresa #${p.id_vacante}</td>
                <td>Postulación ID: ${p.id_postulacion}</td>
                <td>${new Date(p.fecha_postulacion).toLocaleDateString()}</td>
                <td><span class="badge ${claseBadge}">${p.estatus}</span></td>
            `;
            tabla.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar datos con Ajax:', error);
    }
}

// Se ejecuta en cuanto el HTML esté listo
document.addEventListener('DOMContentLoaded', cargarPostulaciones);