document.addEventListener('DOMContentLoaded', cargarAdmin);

async function cargarAdmin() {

    try {

        const response = await fetch('/api/admin');
        const result = await response.json();

        const tabla = document.getElementById('tablaAdmin');

        tabla.innerHTML = '';

        result.data.forEach(data => {

            tabla.innerHTML += `

                <tr>

                    <td>
                        ${data.correo}
                    </td>

                    <td>
                        ${data.tipo_proceso}
                    </td>

                    <td>

                        <span class="badge badge-nuevo">
                            ${data.estatus}
                        </span>

                    </td>

                </tr>

            `;
        });

    } catch (error) {

        console.error(error);

    }

}
