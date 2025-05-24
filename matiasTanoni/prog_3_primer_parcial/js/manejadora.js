document.addEventListener("DOMContentLoaded", () => {
    mostrarSeccion("inicio");
    mostrarPinturas();
    mostrarTotalPinturas();
    mostrarMarcaMasComun();
    mostrarPinturaMasCara();
    mostrarPromedios();
    document.getElementById("btnModificar").disabled = true;
    document.getElementById("btnModificar").addEventListener("submit", modificarPinturas);
    document.getElementById("btnAgregar").addEventListener("click", agregarPinturas)
});
let pinturasActuales = [];
let idAEliminar = null;

async function mostrarPinturas(pinturasFiltradas = null) {
    const panel = document.getElementById("panel-derecha");
    panel.innerHTML = "<div class='spinner-border text-primary' role='status'></div>";

    try {
        let pinturas;

        if (pinturasFiltradas) {
            pinturas = pinturasFiltradas;
        } else {
            const res = await fetch("https://utnfra-api-pinturas.onrender.com/pinturas");
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            const data = await res.json();
            pinturas = data.pinturas ?? data;
        }

        pinturasActuales = pinturas;
        let tabla = `
        <div class="m-2" style="max-height: 700px; overflow-y: auto;">
            <table class="table table-dark table-striped mb-0" style=" border-collapse: separate; border-spacing: 0">
                <thead style="position: sticky; top: 0; background-color: #343a40; z-index: 1;">
                    <tr>
                        <th>ID</th>
                        <th>Marca</th>
                        <th>Precio</th>
                        <th>Color</th>
                        <th>Cantidad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        pinturas.forEach(pintura => {
            tabla += `
                <tr>
                    <td>${pintura.id}</td>
                    <td>${pintura.marca}</td>
                    <td>${pintura.precio}</td>
                    <td><input type="color" value="${pintura.color}" disabled></td>
                    <td>${pintura.cantidad}</td>
                    <td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="eliminarPintura(${pintura.id}, '${pintura.marca}', '${pintura.precio}')">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                        <button class="btn btn-primary btn-sm py-0 px-1" onclick='cargarPintura(${pintura.id})'>
                            <i class="bi bi-check"></i>Seleccionar
                        </button>
                    </td>   
                </tr>
            `;
        });

        tabla += `
                </tbody>
            </table>
        </div>`;

        panel.innerHTML = tabla;
    } catch (error) {
        mostrarAlerta("Error al mostrar la pintura.", "danger");
    }
}

function limpiarFormulario() {
    document.getElementById("frmFormulario").reset();

    const id = document.getElementById("inputID");
    const marca = document.getElementById("inputMarca");
    const precio = document.getElementById("inputPrecio");
    const color = document.getElementById("inputColor");
    const cantidad = document.getElementById("inputCantidad");

    marca.classList.remove("is-valid");
    id.classList.remove("is-valid");
    precio.classList.remove("is-valid");
    color.classList.remove("is-valid");
    cantidad.classList.remove("is-valid");
}

function limpiarFormularioAlta() {
    document.getElementById("frmFormularioAlta").reset();

    const id = document.getElementById("inputIDAlta");
    const marca = document.getElementById("inputMarcaAlta");
    const precio = document.getElementById("inputPrecioAlta");
    const color = document.getElementById("inputColorAlta");
    const cantidad = document.getElementById("inputCantidadAlta");

    marca.classList.remove("is-valid");
    id.classList.remove("is-valid");
    precio.classList.remove("is-valid");
    color.classList.remove("is-valid");
    cantidad.classList.remove("is-valid");
}

function obtenerPinturasAlta() {
    const idValue = document.getElementById("inputIDAlta").value;
    const marca = document.getElementById("inputMarcaAlta").value;
    const precio = parseFloat(document.getElementById("inputPrecioAlta").value);
    const color = document.getElementById("inputColorAlta").value;
    const cantidad = parseInt(document.getElementById("inputCantidadAlta").value);

    const pintura = { marca, precio, color, cantidad };
    if (idValue) {
        pintura.id = parseInt(idValue);
    }
    return pintura;
}

async function agregarPinturas() {

    const pintura = obtenerPinturasAlta();

    if (!ValidarFormularioAlta()) { return; }

    try {
        const res = await fetch("https://utnfra-api-pinturas.onrender.com/pinturas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pintura)
        });
        if (res.ok) {
            mostrarPinturas();
            limpiarFormularioAlta();
            mostrarAlerta("Pintura agregada con éxito.", "success");
        } else {
            mostrarAlerta("Error al agregar la pintura.", "danger");
        }


    } catch (error) {
        mostrarAlerta("Error al agregar la pintura.", "danger");
    }

}

function eliminarPintura(id, marca, precio) {

    const modalTexto = `
        ¿Está seguro que desea eliminar la pintura con:<br>
        <strong>ID:</strong> ${id}<br>
        <strong>Marca:</strong> ${marca}<br>
        <strong>Precio:</strong> ${precio} USD
    `;
    document.getElementById("modalConfirmacionTexto").innerHTML = modalTexto;

    const modalEl = document.getElementById("modalConfirmacion");

    if (bootstrap.Modal.getInstance(modalEl)) {
        bootstrap.Modal.getInstance(modalEl).hide();
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();


    const boton = document.getElementById("btnConfirmarEliminar");
    const nuevoBoton = boton.cloneNode(true);
    boton.parentNode.replaceChild(nuevoBoton, boton);

    nuevoBoton.addEventListener("click", async () => {
        try {
            const respuesta = await fetch(`https://utnfra-api-pinturas.onrender.com/pinturas/${id}`, {
                method: "DELETE"
            });

            if (!respuesta.ok) throw new Error("Error al eliminar");

            mostrarAlerta("Pintura eliminada correctamente", "success");
            mostrarPinturas();

            const modalCerrar = bootstrap.Modal.getInstance(document.getElementById("modalConfirmacion"));
            modalCerrar.hide();
        } catch (err) {
            mostrarAlerta("Error al eliminar la pintura", "danger");
        }
    });
}

async function cargarPintura(id) {
    try {
        const res = await fetch(`https://utnfra-api-pinturas.onrender.com/pinturas/${id}`);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

        const data = await res.json();

        if (!data.exito || !data.pintura) {
            mostrarAlerta("Error al cargar la pintura.", "danger");
            return;
        }

        const pintura = data.pintura;


        document.getElementById("inputID").value = pintura.id ?? "";
        document.getElementById("inputID").disabled = true;
        document.getElementById("inputMarca").value = pintura.marca ?? "";
        document.getElementById("inputPrecio").value = pintura.precio ?? "";
        document.getElementById("inputColor").value = pintura.color ?? "#000000";
        document.getElementById("inputCantidad").value = pintura.cantidad ?? 0;

        mostrarAlerta("Pintura cargada con éxito.", "success");

        document.getElementById("btnModificar").disabled = false;

        const form = document.getElementById("frmFormulario");
        form.removeEventListener("click", agregarPinturas);
        form.addEventListener("submit", modificarPinturas);

    } catch (error) {
        mostrarAlerta("Error al cargar la pintura.", "danger");
    }
}

function obtenerPinturas() {
    const idValue = document.getElementById("inputID").value;
    const marca = document.getElementById("inputMarca").value;
    const precio = parseFloat(document.getElementById("inputPrecio").value);
    const color = document.getElementById("inputColor").value;
    const cantidad = parseInt(document.getElementById("inputCantidad").value);

    const pintura = { marca, precio, color, cantidad };
    if (idValue) {
        pintura.id = parseInt(idValue);
    }
    return pintura;
}

async function modificarPinturas(e) {
    e.preventDefault();

    if (!ValidarFormulario()) { return; }
    const pintura = obtenerPinturas();

    try {
        const res = await fetch(`https://utnfra-api-pinturas.onrender.com/pinturas/${pintura.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pintura)
        });
        if (res.ok) {
            mostrarPinturas();
            limpiarFormulario();
            mostrarAlerta("Pintura modificada con éxito.", "success");
            document.getElementById("btnModificar").disabled = true;
        } else {
            mostrarAlerta("Error al modificar la pintura.", "danger");
        }
    } catch (error) {
        mostrarAlerta("Error al modificar la pintura.", "danger");
    }
}

function ValidarFormulario() {

    const id = document.getElementById("inputID");
    const marca = document.getElementById("inputMarca");
    const precio = document.getElementById("inputPrecio");
    const color = document.getElementById("inputColor");
    const cantidad = document.getElementById("inputCantidad");

    let valid = true;

    [id, marca, precio, color, cantidad].forEach(el => {
        el.classList.remove("is-invalid");
        const feedback = el.nextElementSibling;
        if (feedback && feedback.classList.contains("invalid-feedback")) {
            feedback.style.display = "none";
        }
    });

    if (!marca.value.trim()) {
        marca.classList.add("is-invalid");
        marca.nextElementSibling.style.display = "block";
        valid = false;
    } else {
        marca.classList.add("is-valid");
    }

    const precioVal = parseFloat(precio.value);
    if (isNaN(precioVal) || precioVal < 50 || precioVal > 500) {
        precio.classList.add("is-invalid");
        precio.nextElementSibling.style.display = "block";
        valid = false;
    }
    else {
        precio.classList.add("is-valid");
    }

    if (!color.value.trim()) {
        color.classList.add("is-invalid");
        color.nextElementSibling.style.display = "block";
        valid = false;
    } else {
        color.classList.add("is-valid");
    }

    const cantidadVal = parseInt(cantidad.value);
    if (isNaN(cantidadVal) || cantidadVal < 1 || cantidadVal > 400) {
        cantidad.classList.add("is-invalid");
        cantidad.nextElementSibling.style.display = "block";
        valid = false;
    } else {
        cantidad.classList.add("is-valid");
    }

    return valid;
}

function ValidarFormularioAlta() {

    const id = document.getElementById("inputIDAlta");
    const marca = document.getElementById("inputMarcaAlta");
    const precio = document.getElementById("inputPrecioAlta");
    const color = document.getElementById("inputColorAlta");
    const cantidad = document.getElementById("inputCantidadAlta");

    let valid = true;

    [id, marca, precio, color, cantidad].forEach(el => {
        el.classList.remove("is-invalid");
        const feedback = el.nextElementSibling;
        if (feedback && feedback.classList.contains("invalid-feedback")) {
            feedback.style.display = "none";
        }
    });

    if (!marca.value.trim()) {
        marca.classList.add("is-invalid");
        marca.nextElementSibling.style.display = "block";
        valid = false;
    } else {
        marca.classList.add("is-valid");
    }

    const precioVal = parseFloat(precio.value);
    if (isNaN(precioVal) || precioVal < 50 || precioVal > 500) {
        precio.classList.add("is-invalid");
        precio.nextElementSibling.style.display = "block";
        valid = false;
    } else {
        precio.classList.add("is-valid");
    }

    if (!color.value.trim()) {
        color.classList.add("is-invalid");
        color.nextElementSibling.style.display = "block";
        valid = false;
    } else {
        color.classList.add("is-valid");
    }

    const cantidadVal = parseInt(cantidad.value);
    if (isNaN(cantidadVal) || cantidadVal < 1 || cantidadVal > 400) {
        cantidad.classList.add("is-invalid");
        cantidad.nextElementSibling.style.display = "block";
        valid = false;
    } else {
        cantidad.classList.add("is-valid");
    }

    return valid;
}

async function filtrarPinturas() {
    const filtroMarca = document.getElementById("inputMarca").value.trim().toLowerCase();

    try {
        const res = await fetch("https://utnfra-api-pinturas.onrender.com/pinturas");
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        const pinturas = data.pinturas ?? data;

        const filtradas = pinturas.filter(p =>
            String(p.marca).toLowerCase().includes(filtroMarca)
        );

        mostrarPinturas(filtradas);
    } catch (error) {
        mostrarAlerta("Error al filtrar las pinturas.", "danger");
    }
}

function calcularPromedio() {
    if (!pinturasActuales || pinturasActuales.length === 0) {
        mostrarAlerta("No hay pinturas para calcular el promedio", "danger");
        return;
    }

    let suma = 0;
    let contador = 0;

    pinturasActuales.forEach(pintura => {
        const precioNum = Number(pintura.precio);
        if (!isNaN(precioNum)) {
            suma += precioNum;
            contador++;
        }
    });

    if (contador === 0) {
        mostrarAlerta("No hay precios válidos para calcular el promedio", "danger");
        return;
    }

    const promedio = suma / contador;
    mostrarAlerta(`El precio promedio es: $${promedio.toFixed(2)}`, "success");
}

function mostrarAlerta(mensaje, tipo = "success", duracion = 3000) {
    const container = document.getElementById("alert-container");

    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.role = "alert";
    alerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    container.appendChild(alerta);

    setTimeout(() => {
        alerta.classList.remove("show");
        alerta.classList.add("hide");
        alerta.addEventListener("transitionend", () => alerta.remove());
    }, duracion);
}

function resaltarPaginaActual() {
    const path = window.location.pathname.split("/").pop().toLowerCase();

    document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
        const linkPath = link.getAttribute("href").split("/").pop().toLowerCase();
        if (path === linkPath) {
            link.classList.add("active-border");
        } else {
            link.classList.remove("active-border");
        }
    });
}

async function mostrarTotalPinturas() {

    const res = await fetch("https://utnfra-api-pinturas.onrender.com/pinturas");
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    pinturas = data.pinturas ?? data;
    const total = pinturas?.length ?? 0;

    const totalElement = document.getElementById("total-pinturas");
    if (totalElement) {
        totalElement.textContent = total;
    }
}

async function mostrarMarcaMasComun() {
    try {
        const res = await fetch("https://utnfra-api-pinturas.onrender.com/pinturas");
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        const pinturas = data.pinturas ?? data;

        const conteoMarcas = {};
        for (const pintura of pinturas) {
            const marca = pintura.marca ?? "Desconocida";
            conteoMarcas[marca] = (conteoMarcas[marca] || 0) + 1;
        }

        let marcaMasComun = "";
        let maxRepeticiones = 0;
        for (const [marca, cantidad] of Object.entries(conteoMarcas)) {
            if (cantidad > maxRepeticiones) {
                maxRepeticiones = cantidad;
                marcaMasComun = marca;
            }
        }

        const marcaElement = document.getElementById("marca-mas-comun");
        if (marcaElement) {
            marcaElement.textContent = `${marcaMasComun} (${maxRepeticiones} repeticiones)`;
        }

    } catch (error) {
        mostrarAlerta("Error al mostrar la marca mas comun", "danger");
    }
}

async function mostrarPinturaMasCara() {
    try {
        const res = await fetch("https://utnfra-api-pinturas.onrender.com/pinturas");
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        const pinturas = data.pinturas ?? data;

        if (!Array.isArray(pinturas) || pinturas.length === 0) {
            throw new Error("No hay pinturas disponibles.");
        }

        let pinturaMasCara = pinturas[0];
        for (const pintura of pinturas) {
            if (parseFloat(pintura.precio) > parseFloat(pinturaMasCara.precio)) {
                pinturaMasCara = pintura;
            }
        }
        const pinturaElement = document.getElementById("pintura-mas-cara");
        if (pinturaElement) {

            pinturaElement.textContent = `${pinturaMasCara.marca ?? 'Sin marca'} | ${pinturaMasCara.color ?? 'Sin color'} - $${pinturaMasCara.precio ?? 0}`;
        }

    } catch (error) {
        mostrarAlerta("Error al mostrar la pintura mas cara", "danger");
    }
}

async function mostrarPromedios() {
    try {
        const res = await fetch("https://utnfra-api-pinturas.onrender.com/pinturas");
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        const pinturas = data.pinturas ?? data;

        if (!Array.isArray(pinturas) || pinturas.length === 0) {
            throw new Error("No hay pinturas disponibles.");
        }

        const pinturasValidas = pinturas.filter(p => !isNaN(parseFloat(p.precio)));

        const totalPrecio = pinturasValidas.reduce((acc, pintura) => acc + parseFloat(pintura.precio), 0);
        const promedioGeneral = totalPrecio / pinturasValidas.length;

        const preciosPorMarca = pinturasValidas.reduce((acc, pintura) => {
            const marca = pintura.marca && pintura.marca.trim() !== '' ? pintura.marca : 'Sin marca';
            if (!acc[marca]) acc[marca] = [];
            acc[marca].push(parseFloat(pintura.precio));
            return acc;
        }, {});

        const promediosPorMarca = Object.entries(preciosPorMarca).map(([marca, precios]) => {
            const suma = precios.reduce((a, b) => a + b, 0);
            return {
                marca,
                promedio: suma / precios.length
            };
        });

        const promedioGeneralElement = document.getElementById("promedio-general");
        if (promedioGeneralElement) {
            promedioGeneralElement.textContent = `Promedio general: $${promedioGeneral.toFixed(2)}`;
        }

        const promediosMarcaElement = document.getElementById("promedios-por-marca");
        if (promediosMarcaElement) {
            promediosMarcaElement.innerHTML = promediosPorMarca
                .map(pm => `<p>Marca: ${pm.marca} - Promedio: $${pm.promedio.toFixed(2)}</p>`)
                .join('');
        }

    } catch (error) {
        mostrarAlerta("Error al calcular promedios", "danger");
    }
}

function resaltarPaginaActual() {
    const seccionActiva = document.querySelector("main.active"); 
    if (!seccionActiva) return;

    const idActiva = seccionActiva.id;

    document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
        const onclick = link.getAttribute("onclick");
        if (onclick && onclick.includes(`'${idActiva}'`)) {
            link.classList.add("active-border");
        } else {
            link.classList.remove("active-border");
        }
    });
}

function mostrarSeccion(id) {
    document.querySelectorAll("main").forEach(seccion => {
        seccion.classList.remove("active");
    });
    document.getElementById(id).classList.add("active");

    resaltarPaginaActual();
}