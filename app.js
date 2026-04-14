const SUPABASE_URL = "https://aikjybpvxeigdjmmcafz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa2p5YnB2eGVpZ2RqbW1jYWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzY4NzMsImV4cCI6MjA5MTc1Mjg3M30.w2wG5Kw833thXEArjsSjShznapKd_l5WASPXPCJiEuc";

// FIX: No inicializar supabase al cargar el script (el SDK puede no estar listo aún).
// Se inicializa de forma lazy la primera vez que se necesita.
var _supabaseClient = null;
function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _supabaseClient;
}
/* =============================================
   REPOSITORIO ACADÉMICO - UPLA
   Lógica principal (app.js)
   ============================================= */

// =============================================
// USUARIOS DEL SISTEMA (simulados)
// =============================================
var USUARIOS = [
  { usuario: "admin", password: "vivand123", rol: "admin", nombre: "Administrador" },
  { usuario: "visitante", password: "upla2024", rol: "usuario", nombre: "Alumno UPLA" },
  { usuario: "docente", password: "docente1", rol: "usuario", nombre: "Docente Invitado" }
];

// =============================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================

function iniciarSesion(usuario, password) {
  var encontrado = null;
  for (var i = 0; i < USUARIOS.length; i++) {
    if (USUARIOS[i].usuario === usuario && USUARIOS[i].password === password) {
      encontrado = USUARIOS[i];
      break;
    }
  }

  if (encontrado) {
    localStorage.setItem("sesion", JSON.stringify({
      usuario: encontrado.usuario,
      rol: encontrado.rol,
      nombre: encontrado.nombre
    }));
    return encontrado;
  }

  return null;
}

function obtenerSesion() {
  var sesion = localStorage.getItem("sesion");
  if (sesion) {
    return JSON.parse(sesion);
  }
  return null;
}

function cerrarSesion() {
  localStorage.removeItem("sesion");
  window.location.href = "index.html";
}

function protegerPagina(rolRequerido) {
  var sesion = obtenerSesion();
  if (!sesion) {
    window.location.href = "../index.html";
    return null;
  }
  if (rolRequerido && sesion.rol !== rolRequerido) {
    if (sesion.rol === "admin") {
      window.location.href = "/dashboard.html";
    } else {
      window.location.href = "/dashboardalumno.html";
    }
    return null;
  }
  return sesion;
}

// =============================================
// FUNCIONES DE DATOS (LocalStorage)
// =============================================

function obtenerSemanas() {
  var datos = localStorage.getItem("semanas");
  if (datos) {
    return JSON.parse(datos);
  }
  return [];
}

function guardarSemanas(semanas) {
  localStorage.setItem("semanas", JSON.stringify(semanas));
}

function agregarSemana(nombre) {
  var semanas = obtenerSemanas();
  var nueva = {
    id: Date.now(),
    nombre: nombre,
    archivos: []
  };
  semanas.push(nueva);
  guardarSemanas(semanas);
  return nueva;
}

function eliminarSemana(id) {
  var semanas = obtenerSemanas();
  semanas = semanas.filter(function(s) { return s.id !== id; });
  guardarSemanas(semanas);
}

function obtenerSemana(id) {
  var semanas = obtenerSemanas();
  for (var i = 0; i < semanas.length; i++) {
    if (semanas[i].id === id) {
      return semanas[i];
    }
  }
  return null;
}

function agregarArchivo(semanaId, nombreArchivo, tipo, url) {
  var semanas = obtenerSemanas();
  for (var i = 0; i < semanas.length; i++) {
    if (semanas[i].id === semanaId) {
      var archivo = {
        id: Date.now(),
        nombre: nombreArchivo,
        tipo: tipo || "otro",
        url: url || "",
        fecha: new Date().toLocaleDateString("es-PE")
      };
      semanas[i].archivos.push(archivo);
      guardarSemanas(semanas);
      return archivo;
    }
  }
  return null;
}

function eliminarArchivo(semanaId, archivoId) {
  var semanas = obtenerSemanas();
  for (var i = 0; i < semanas.length; i++) {
    if (semanas[i].id === semanaId) {
      semanas[i].archivos = semanas[i].archivos.filter(function(a) {
        return a.id !== archivoId;
      });
      guardarSemanas(semanas);
      return;
    }
  }
}

// =============================================
// FUNCIONES DE UI
// =============================================

function obtenerIconoTipo(tipo) {
  switch (tipo) {
    case "pdf": return "📄";
    case "imagen": return "🖼️";
    case "excel": return "📊";
    default: return "📁";
  }
}

function obtenerBadgeTipo(tipo) {
  switch (tipo) {
    case "pdf": return '<span class="tipo-badge tipo-pdf">PDF</span>';
    case "imagen": return '<span class="tipo-badge tipo-imagen">Imagen</span>';
    case "excel": return '<span class="tipo-badge tipo-excel">Excel</span>';
    default: return '<span class="tipo-badge tipo-otro">Otro</span>';
  }
}

function mostrarMensaje(elementoId, texto, esError) {
  var el = document.getElementById(elementoId);
  if (!el) return;
  el.textContent = texto;
  el.className = "mensaje visible " + (esError ? "error" : "exito");
  setTimeout(function() {
    el.className = "mensaje";
  }, 3000);
}

// =============================================
// LÓGICA DE LOGIN
// =============================================

function initLogin() {
  // Si ya hay sesión, redirigir
  var sesion = obtenerSesion();
  if (sesion) {
    if (sesion.rol === "admin") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "dashboardalumno.html";
    }
    return;
  }

  var form = document.getElementById("form-login");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var usuario = document.getElementById("input-usuario").value.trim();
    var password = document.getElementById("input-password").value;
    var errorEl = document.getElementById("login-error");

    if (!usuario || !password) {
      errorEl.textContent = "Por favor complete todos los campos.";
      return;
    }

    var resultado = iniciarSesion(usuario, password);

    if (resultado) {
      errorEl.textContent = "";
      if (resultado.rol === "admin") {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "dashboardalumno.html";
      }
    } else {
      errorEl.textContent = "Usuario o contraseña incorrectos.";
    }
  });
}

// =============================================
// LÓGICA DEL DASHBOARD ADMIN
// =============================================

var semanaSeleccionadaId = null;
var mostrandoFormSemana = false;

function initAdmin() {
  var sesion = protegerPagina("admin");
  if (!sesion) return;

  // Mostrar nombre de usuario
  var elNombre = document.getElementById("nombre-usuario");
  if (elNombre) elNombre.textContent = sesion.nombre;

  // Botón cerrar sesión
  var btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", cerrarSesion);
  }

  // Botón agregar semana
  var btnAgregarSemana = document.getElementById("btn-agregar-semana");
  if (btnAgregarSemana) {
    btnAgregarSemana.addEventListener("click", function() {
      toggleFormSemana();
    });
  }

  // Formulario inline para semana
  var btnConfirmarSemana = document.getElementById("btn-confirmar-semana");
  if (btnConfirmarSemana) {
    btnConfirmarSemana.addEventListener("click", function() {
      var inputNombre = document.getElementById("input-nombre-semana");
      var nombre = inputNombre ? inputNombre.value.trim() : "";
      if (!nombre) {
        alert("Ingrese un nombre para la semana.");
        return;
      }
      agregarSemana(nombre);
      if (inputNombre) inputNombre.value = "";
      ocultarFormSemana();
      renderSidebar();
    });
  }

  var btnCancelarSemana = document.getElementById("btn-cancelar-semana");
  if (btnCancelarSemana) {
    btnCancelarSemana.addEventListener("click", function() {
      ocultarFormSemana();
    });
  }

  // Modal agregar archivo
  var btnAgregarArchivo = document.getElementById("btn-agregar-archivo");
  if (btnAgregarArchivo) {
    btnAgregarArchivo.addEventListener("click", function() {
      abrirModalArchivo();
    });
  }

  var btnCancelarArchivo = document.getElementById("btn-cancelar-archivo");
  if (btnCancelarArchivo) {
    btnCancelarArchivo.addEventListener("click", function() {
      cerrarModal("modal-archivo");
    });
  }

  var btnCerrarArchivo = document.getElementById("btn-cerrar-archivo");
  if (btnCerrarArchivo) {
    btnCerrarArchivo.addEventListener("click", function() {
      cerrarModal("modal-archivo");
    });
  }

 const formArchivo = document.getElementById("form-archivo");
const fileInput = document.getElementById("input-file");

formArchivo.addEventListener("submit", async function(e) {
  e.preventDefault();

  const nombre = document.getElementById("input-nombre-archivo").value;
  const tipo = document.getElementById("select-tipo").value;
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecciona un archivo");
    return;
  }

  const fileName = Date.now() + "_" + file.name;

  // 🔥 Subir a Supabase
  const supabaseClient = getSupabase();
  const { data, error } = await supabaseClient.storage
    .from("archivos")
    .upload(fileName, file);

  if (error) {
    alert("Error al subir archivo: " + error.message);
    console.error(error);
    return;
  }

  // 🔥 Obtener URL pública
  const { data: urlData } = supabaseClient.storage
    .from("archivos")
    .getPublicUrl(fileName);

  // FIX: Se reemplaza agregarArchivoASemana (no existía) por la función correcta
  agregarArchivo(semanaSeleccionadaId, nombre, tipo, urlData.publicUrl);

formArchivo.reset();
cerrarModal("modal-archivo");
renderContenido();
mostrarMensaje("mensaje-archivo", "Archivo subido correctamente ✅", false);
});

  // Modal preview
  var btnCerrarPreview = document.getElementById("btn-cerrar-preview");
  if (btnCerrarPreview) {
    btnCerrarPreview.addEventListener("click", function() {
      cerrarModal("modal-preview");
    });
  }

  renderSidebar();
  renderContenido();
}

function toggleFormSemana() {
  var form = document.getElementById("form-semana-inline");
  if (!form) return;
  mostrandoFormSemana = !mostrandoFormSemana;
  form.style.display = mostrandoFormSemana ? "block" : "none";
  if (mostrandoFormSemana) {
    var input = document.getElementById("input-nombre-semana");
    if (input) input.focus();
  }
}

function ocultarFormSemana() {
  var form = document.getElementById("form-semana-inline");
  if (form) form.style.display = "none";
  mostrandoFormSemana = false;
}

function renderSidebar() {
  var lista = document.getElementById("lista-semanas");
  if (!lista) return;

  var semanas = obtenerSemanas();

  if (semanas.length === 0) {
    lista.innerHTML = '<div class="sidebar-empty">No hay semanas aún.</div>';
    return;
  }

  var html = "";
  for (var i = 0; i < semanas.length; i++) {
    var s = semanas[i];
    var activa = (semanaSeleccionadaId === s.id) ? " activa" : "";
    html += '<div class="semana-item' + activa + '" data-id="' + s.id + '">';
    html += '<span class="semana-nombre">📚 ' + s.nombre + '</span>';
    html += '<div class="semana-acciones">';
    html += '<button class="btn-icono btn-del-semana" data-id="' + s.id + '" title="Eliminar">✕</button>';
    html += '</div>';
    html += '</div>';
  }
  lista.innerHTML = html;

  // Eventos en items de semana
  var items = lista.querySelectorAll(".semana-item");
  for (var j = 0; j < items.length; j++) {
    items[j].addEventListener("click", function(e) {
      if (e.target.classList.contains("btn-del-semana")) return;
      var id = parseInt(this.getAttribute("data-id"));
      semanaSeleccionadaId = id;
      renderSidebar();
      renderContenido();
    });
  }

  // Botones eliminar semana
  var btnsEliminar = lista.querySelectorAll(".btn-del-semana");
  for (var k = 0; k < btnsEliminar.length; k++) {
    btnsEliminar[k].addEventListener("click", function(e) {
      e.stopPropagation();
      var id = parseInt(this.getAttribute("data-id"));
      if (confirm("¿Eliminar esta semana y todos sus archivos?")) {
        if (semanaSeleccionadaId === id) {
          semanaSeleccionadaId = null;
        }
        eliminarSemana(id);
        renderSidebar();
        renderContenido();
      }
    });
  }
}

function renderContenido() {
  var contenido = document.getElementById("contenido-principal");
  if (!contenido) return;

  if (!semanaSeleccionadaId) {
    contenido.innerHTML = '<div class="main-placeholder">' +
      '<div class="icono-grande">📂</div>' +
      '<p>Seleccione una semana del panel izquierdo<br>o cree una nueva para comenzar.</p>' +
      '</div>';
    return;
  }

  var semana = obtenerSemana(semanaSeleccionadaId);
  if (!semana) {
    semanaSeleccionadaId = null;
    renderContenido();
    return;
  }

  var html = '<div class="semana-header">';
  html += '<h2>📚 ' + semana.nombre + '</h2>';
  html += '<button class="btn-primario" id="btn-agregar-archivo">+ Agregar archivo</button>';
  html += '</div>';

  html += '<div id="mensaje-archivo" class="mensaje"></div>';

  html += '<table class="tabla-archivos">';
  html += '<thead><tr>';
  html += '<th>Tipo</th>';
  html += '<th>Nombre del archivo</th>';
  html += '<th>Fecha</th>';
  html += '<th>Acciones</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  if (semana.archivos.length === 0) {
    html += '<tr class="tabla-vacia"><td colspan="4">No hay archivos en esta semana. Haga clic en "+ Agregar archivo".</td></tr>';
  } else {
    for (var i = 0; i < semana.archivos.length; i++) {
      var a = semana.archivos[i];
      html += '<tr>';
      html += '<td>' + obtenerBadgeTipo(a.tipo) + '</td>';
      html += '<td>' + obtenerIconoTipo(a.tipo) + ' ' + a.nombre + '</td>';
      html += '<td>' + a.fecha + '</td>';
      html += '<td><div class="acciones-td">';
      html += '<button class="btn-ver" data-archivo-id="' + a.id + '">👁 Ver</button>';
      html += '<button class="btn-eliminar" data-archivo-id="' + a.id + '">🗑 Eliminar</button>';
      html += '</div></td>';
      html += '</tr>';
    }
  }

  html += '</tbody></table>';
  contenido.innerHTML = html;

  // Re-bind botón agregar archivo
  var btnAgregar = document.getElementById("btn-agregar-archivo");
  if (btnAgregar) {
    btnAgregar.addEventListener("click", function() {
      abrirModalArchivo();
    });
  }

  // Botones ver
  var btnsVer = contenido.querySelectorAll(".btn-ver");
  for (var j = 0; j < btnsVer.length; j++) {
    btnsVer[j].addEventListener("click", function() {
      var aid = parseInt(this.getAttribute("data-archivo-id"));
      var semana = obtenerSemana(semanaSeleccionadaId);
      if (!semana) return;
      for (var k = 0; k < semana.archivos.length; k++) {
        if (semana.archivos[k].id === aid) {
          abrirPreview(semana.archivos[k]);
          break;
        }
      }
    });
  }

  // Botones eliminar archivo
  var btnsEliminar = contenido.querySelectorAll(".btn-eliminar");
  for (var m = 0; m < btnsEliminar.length; m++) {
    btnsEliminar[m].addEventListener("click", function() {
      var aid = parseInt(this.getAttribute("data-archivo-id"));
      if (confirm("¿Eliminar este archivo?")) {
        eliminarArchivo(semanaSeleccionadaId, aid);
        renderContenido();
        mostrarMensaje("mensaje-archivo", "Archivo eliminado correctamente.", false);
      }
    });
  }
}

function abrirModalArchivo() {
  if (!semanaSeleccionadaId) {
    alert("Seleccione una semana primero.");
    return;
  }
  var form = document.getElementById("form-archivo");
  if (form) form.reset();
  abrirModal("modal-archivo");
}

function guardarArchivo() {
  var nombre = document.getElementById("input-nombre-archivo").value.trim();
  var tipo = document.getElementById("select-tipo").value;
  var url = document.getElementById("input-url-archivo").value.trim();

  if (!nombre) {
    alert("Ingrese el nombre del archivo.");
    return;
  }

  agregarArchivo(semanaSeleccionadaId, nombre, tipo, url);
  cerrarModal("modal-archivo");
  renderContenido();
  mostrarMensaje("mensaje-archivo", "Archivo agregado correctamente.", false);
}

// =============================================
// LÓGICA DEL DASHBOARD USUARIO
// =============================================

var semanaSeleccionadaIdUsuario = null;

function initUsuario() {
  var sesion = protegerPagina("usuario");
  if (!sesion) return;

  var elNombre = document.getElementById("nombre-usuario");
  if (elNombre) elNombre.textContent = sesion.nombre;

  var btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", cerrarSesion);
  }

  // Cerrar preview
  var btnCerrarPreview = document.getElementById("btn-cerrar-preview");
  if (btnCerrarPreview) {
    btnCerrarPreview.addEventListener("click", function() {
      cerrarModal("modal-preview");
    });
  }

  renderSidebarUsuario();
  renderContenidoUsuario();
}

function renderSidebarUsuario() {
  var lista = document.getElementById("lista-semanas");
  if (!lista) return;

  var semanas = obtenerSemanas();

  if (semanas.length === 0) {
    lista.innerHTML = '<div class="sidebar-empty">No hay contenido disponible aún.</div>';
    return;
  }

  var html = "";
  for (var i = 0; i < semanas.length; i++) {
    var s = semanas[i];
    var activa = (semanaSeleccionadaIdUsuario === s.id) ? " activa" : "";
    html += '<div class="semana-item' + activa + '" data-id="' + s.id + '">';
    html += '<span class="semana-nombre">📚 ' + s.nombre + '</span>';
    html += '<span style="font-size:11px;color:#9ca3af">' + s.archivos.length + ' arch.</span>';
    html += '</div>';
  }
  lista.innerHTML = html;

  var items = lista.querySelectorAll(".semana-item");
  for (var j = 0; j < items.length; j++) {
    items[j].addEventListener("click", function() {
      semanaSeleccionadaIdUsuario = parseInt(this.getAttribute("data-id"));
      renderSidebarUsuario();
      renderContenidoUsuario();
    });
  }
}

function renderContenidoUsuario() {
  var contenido = document.getElementById("contenido-principal");
  if (!contenido) return;

  if (!semanaSeleccionadaIdUsuario) {
    contenido.innerHTML = '<div class="main-placeholder">' +
      '<div class="icono-grande">📖</div>' +
      '<p>Seleccione una semana del panel izquierdo<br>para ver los materiales disponibles.</p>' +
      '</div>';
    return;
  }

  var semana = obtenerSemana(semanaSeleccionadaIdUsuario);
  if (!semana) {
    semanaSeleccionadaIdUsuario = null;
    renderContenidoUsuario();
    return;
  }

  var html = '<div class="semana-header">';
  html += '<h2>📚 ' + semana.nombre + '</h2>';
  html += '<span style="font-size:13px;color:#6b7280">Solo lectura</span>';
  html += '</div>';

  html += '<table class="tabla-archivos">';
  html += '<thead><tr>';
  html += '<th>Tipo</th>';
  html += '<th>Nombre del archivo</th>';
  html += '<th>Fecha</th>';
  html += '<th>Ver</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  if (semana.archivos.length === 0) {
    html += '<tr class="tabla-vacia"><td colspan="4">No hay archivos en esta semana todavía.</td></tr>';
  } else {
    for (var i = 0; i < semana.archivos.length; i++) {
      var a = semana.archivos[i];
      html += '<tr>';
      html += '<td>' + obtenerBadgeTipo(a.tipo) + '</td>';
      html += '<td>' + obtenerIconoTipo(a.tipo) + ' ' + a.nombre + '</td>';
      html += '<td>' + a.fecha + '</td>';
      html += '<td><button class="btn-ver" data-archivo-id="' + a.id + '">👁 Ver</button></td>';
      html += '</tr>';
    }
  }

  html += '</tbody></table>';
  contenido.innerHTML = html;

  var btnsVer = contenido.querySelectorAll(".btn-ver");
  for (var j = 0; j < btnsVer.length; j++) {
    btnsVer[j].addEventListener("click", function() {
      var aid = parseInt(this.getAttribute("data-archivo-id"));
      var sem = obtenerSemana(semanaSeleccionadaIdUsuario);
      if (!sem) return;
      for (var k = 0; k < sem.archivos.length; k++) {
        if (sem.archivos[k].id === aid) {
          abrirPreview(sem.archivos[k]);
          break;
        }
      }
    });
  }
}

// =============================================
// MODAL PREVISUALIZACIÓN
// =============================================

function abrirPreview(archivo) {
  var titulo = document.getElementById("preview-titulo");
  var area = document.getElementById("preview-area");
  if (!titulo || !area) return;

  titulo.textContent = archivo.nombre;
  area.innerHTML = "";

  if (archivo.tipo === "pdf") {
    if (archivo.url) {
      area.innerHTML = '<iframe src="' + archivo.url + '"></iframe>';
    } else {
      area.innerHTML = '<div class="preview-sin-soporte"><span class="icono">📄</span><p>Previsualización de PDF no disponible.<br>No se proporcionó URL del archivo.</p></div>';
    }
  } else if (archivo.tipo === "imagen") {
    if (archivo.url) {
      area.innerHTML = '<img src="' + archivo.url + '" alt="' + archivo.nombre + '">';
    } else {
      area.innerHTML = '<div class="preview-sin-soporte"><span class="icono">🖼️</span><p>Previsualización no disponible.<br>No se proporcionó URL de la imagen.</p></div>';
    }
  } else {
    area.innerHTML = '<div class="preview-sin-soporte"><span class="icono">' + obtenerIconoTipo(archivo.tipo) + '</span><p><strong>' + archivo.nombre + '</strong><br>Este tipo de archivo no tiene previsualización.<br>Descargue el archivo para abrirlo.</p></div>';
  }

  abrirModal("modal-preview");
}

// =============================================
// UTILITARIOS MODAL
// =============================================

function abrirModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add("visible");
}

function cerrarModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove("visible");
}

// Cerrar modal al hacer clic fuera
document.addEventListener("click", function(e) {
  var modales = document.querySelectorAll(".modal-overlay.visible");
  for (var i = 0; i < modales.length; i++) {
    if (e.target === modales[i]) {
      modales[i].classList.remove("visible");
    }
  }
});
