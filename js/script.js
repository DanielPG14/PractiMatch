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

function validarRegistro() {
  const correo = document.getElementById("correo").value.trim();
  if(correo == "admin@prueba.com") {
    window.location.href = "admin_view.html";
  }else if(correo == "alumno@prueba.com") {
    window.location.href = "dashboardAlumno_view.html";
  }else if(correo == "empresa@prueba.com") {
    window.location.href = "dashboardEmpresa_view.html";
  }
}

document.querySelectorAll(".sideMenu a").forEach(link => {
    link.addEventListener("click", function() {
        document.querySelectorAll(".sideMenu a").forEach(a => a.classList.remove("activo"));
        this.classList.add("activo");
    });
});

function returnToDashboard() {
    window.location.href = "../admin_view.html";
}