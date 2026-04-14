/* =============================================
   REPOSITORIO ACADÉMICO - UPLA
   app.js — Versión con Supabase (datos en la nube)
   ============================================= */

const SUPABASE_URL = "https://aikjybpvxeigdjmmcafz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa2p5YnB2eGVpZ2RqbW1jYWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzY4NzMsImV4cCI6MjA5MTc1Mjg3M30.w2wG5Kw833thXEArjsSjShznapKd_l5WASPXPCJiEuc";

var _supabaseClient = null;
function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _supabaseClient;
}

// =============================================
// USUARIOS DEL SISTEMA
// =============================================
var USUARIOS = [
  { usuario: "admin",    password: "vivand123", rol: "admin",   nombre: "Administrador" },
  { usuario: "visitante",password: "upla2024",  rol: "usuario", nombre: "Alumno UPLA"   },
  { usuario: "docente",  password: "docente1",  rol: "usuario", nombre: "Docente Invitado" }
];

// =============================================
// AUTENTICACIÓN (sessionStorage — correcto)
// =============================================
function iniciarSesion(usuario, password) {
  for (var i = 0; i < USUARIOS.length; i++) {
    if (USUARIOS[i].usuario === usuario && USUARIOS[i].password === password) {
      sessionStorage.setItem("sesion", JSON.stringify({
        usuario: USUARIOS[i].usuario,
        rol:     USUARIOS[i].rol,
        nombre:  USUARIOS[i].nombre
      }));
      return USUARIOS[i];
    }
  }
  return null;
}

function obtenerSesion() {
  var sesion = sessionStorage.getItem("sesion");
  return sesion ? JSON.parse(sesion) : null;
}

function cerrarSesion() {
  sessionStorage.removeItem("sesion");
  window.location.href = "index.html";
}

function protegerPagina(rolRequerido) {
  var sesion = obtenerSesion();
  if (!sesion) {
    window.location.href = "index.html";
    return null;
  }
  if (rolRequerido && sesion.rol !== rolRequerido) {
    window.location.href = sesion.rol === "admin" ? "dashboard.html" : "dashboardalumno.html";
    return null;
  }
  return sesion;
}

// =============================================
// FUNCIONES DE DATOS — SUPABASE (async)
// =============================================

async function obtenerSemanas() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("semanas")
    .select("*, archivos(*)")
    .order("created_at", { ascending: true });
  if (error) { console.error("Error al obtener semanas:", error.message); return []; }
  // Normalizar: cada semana tiene propiedad archivos[]
  return data.map(s => ({
    ...s,
    archivos: (s.archivos || []).sort((a, b) => a.created_at > b.created_at ? 1 : -1)
  }));
}

async function obtenerSemana(id) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("semanas")
    .select("*, archivos(*)")
    .eq("id", id)
    .single();
  if (error) { console.error("Error al obtener semana:", error.message); return null; }
  return { ...data, archivos: (data.archivos || []) };
}

async function agregarSemana(nombre) {
  const sb = getSupabase();
  const id = Date.now();
  const { data, error } = await sb
    .from("semanas")
    .insert([{ id, nombre }])
    .select()
    .single();
  if (error) { console.error("Error al agregar semana:", error.message); return null; }
  return { ...data, archivos: [] };
}

async function eliminarSemana(id) {
  const sb = getSupabase();
  // Los archivos se eliminan en cascada si configuraste ON DELETE CASCADE
  const { error } = await sb.from("semanas").delete().eq("id", id);
  if (error) console.error("Error al eliminar semana:", error.message);
}

async function agregarArchivo(semanaId, nombreArchivo, tipo, url) {
  const sb = getSupabase();
  const id = Date.now();
  const fecha = new Date().toLocaleDateString("es-PE");
  const { data, error } = await sb
    .from("archivos")
    .insert([{ id, semana_id: semanaId, nombre: nombreArchivo, tipo: tipo || "otro", url: url || "", fecha }])
    .select()
    .single();
  if (error) { console.error("Error al agregar archivo:", error.message); return null; }
  return data;
}

async function eliminarArchivo(semanaId, archivoId) {
  const sb = getSupabase();
  const { error } = await sb.from("archivos").delete().eq("id", archivoId);
  if (error) console.error("Error al eliminar archivo:", error.message);
}

// =============================================
// UTILIDADES DE UI
// =============================================
function obtenerIconoTipo(tipo) {
  switch (tipo) {
    case "pdf":    return "📄";
    case "imagen": return "🖼️";
    case "excel":  return "📊";
    default:       return "📁";
  }
}

function obtenerBadgeTipo(tipo) {
  switch (tipo) {
    case "pdf":    return '<span class="tipo-badge tipo-pdf">PDF</span>';
    case "imagen": return '<span class="tipo-badge tipo-imagen">Imagen</span>';
    case "excel":  return '<span class="tipo-badge tipo-excel">Excel</span>';
    default:       return '<span class="tipo-badge tipo-otro">Otro</span>';
  }
}

function mostrarMensaje(elementoId, texto, esError) {
  var el = document.getElementById(elementoId);
  if (!el) return;
  el.textContent = texto;
  el.className = "mensaje visible " + (esError ? "error" : "exito");
  setTimeout(function() { el.className = "mensaje"; }, 3000);
}

function mostrarCargando(contenedorId, texto) {
  var el = document.getElementById(contenedorId);
  if (el) el.innerHTML = '<div class="main-placeholder"><div class="icono-grande">⏳</div><p>' + (texto || "Cargando...") + '</p></div>';
}

// =============================================
// LÓGICA DE LOGIN
// =============================================
function initLogin() {
  var sesion = obtenerSesion();
  if (sesion) {
    window.location.href = sesion.rol === "admin" ? "dashboard.html" : "dashboardalumno.html";
    return;
  }

  var form = document.getElementById("form-login");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var usuario  = document.getElementById("input-usuario").value.trim();
    var password = document.getElementById("input-password").value;
    var errorEl  = document.getElementById("login-error");

    if (!usuario || !password) {
      errorEl.textContent = "Por favor complete todos los campos.";
      return;
    }

    var resultado = iniciarSesion(usuario, password);
    if (resultado) {
      errorEl.textContent = "";
      window.location.href = resultado.rol === "admin" ? "dashboard.html" : "dashboardalumno.html";
    } else {
      errorEl.textContent = "Usuario o contraseña incorrectos.";
    }
  });
}

// =============================================
// DASHBOARD ADMINISTRADOR
// =============================================
var semanaSeleccionadaId = null;
var mostrandoFormSemana  = false;

async function initAdmin() {
  var sesion = protegerPagina("admin");
  if (!sesion) return;

  var elNombre = document.getElementById("nombre-usuario");
  if (elNombre) elNombre.textContent = sesion.nombre;

  document.getElementById("btn-logout")
    ?.addEventListener("click", cerrarSesion);

  document.getElementById("btn-agregar-semana")
    ?.addEventListener("click", toggleFormSemana);

  // Confirmar nueva semana
  document.getElementById("btn-confirmar-semana")
    ?.addEventListener("click", async function() {
      var input  = document.getElementById("input-nombre-semana");
      var nombre = input ? input.value.trim() : "";
      if (!nombre) { alert("Ingrese un nombre para la semana."); return; }

      this.textContent = "Guardando...";
      this.disabled = true;

      var nueva = await agregarSemana(nombre);
      if (nueva) {
        if (input) input.value = "";
        ocultarFormSemana();
        await renderSidebar();
      } else {
        alert("Error al guardar la semana. Revise la consola.");
      }

      this.textContent = "Guardar";
      this.disabled = false;
    });

  document.getElementById("btn-cancelar-semana")
    ?.addEventListener("click", ocultarFormSemana);

  // Modal archivo — cerrar
  document.getElementById("btn-cerrar-archivo")
    ?.addEventListener("click", () => cerrarModal("modal-archivo"));
  document.getElementById("btn-cancelar-archivo")
    ?.addEventListener("click", () => cerrarModal("modal-archivo"));

  // Modal archivo — submit (subir a Supabase Storage)
  var formArchivo = document.getElementById("form-archivo");
  if (formArchivo) {
    formArchivo.addEventListener("submit", async function(e) {
      e.preventDefault();

      var nombre   = document.getElementById("input-nombre-archivo").value.trim();
      var tipo     = document.getElementById("select-tipo").value;
      var fileInput = document.getElementById("input-file");
      var file     = fileInput ? fileInput.files[0] : null;

      if (!semanaSeleccionadaId) { alert("Seleccione una semana primero."); return; }
      if (!nombre)               { alert("Ingrese el nombre del archivo."); return; }
      if (!file)                 { alert("Seleccione un archivo para subir."); return; }

      var btnSubmit = formArchivo.querySelector("[type=submit]");
      if (btnSubmit) { btnSubmit.textContent = "Subiendo..."; btnSubmit.disabled = true; }

      try {
        var sb       = getSupabase();
        var fileName = Date.now() + "_" + file.name.replace(/\s+/g, "_");

        // 1. Subir archivo al bucket "archivos" de Supabase Storage
        var { error: uploadError } = await sb.storage
          .from("archivos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Obtener URL pública
        var { data: urlData } = sb.storage
          .from("archivos")
          .getPublicUrl(fileName);

        // 3. Guardar metadatos en la tabla archivos
        var guardado = await agregarArchivo(semanaSeleccionadaId, nombre, tipo, urlData.publicUrl);
        if (!guardado) throw new Error("No se pudo guardar el registro en la base de datos.");

        formArchivo.reset();
        cerrarModal("modal-archivo");
        await renderContenido();
        mostrarMensaje("mensaje-archivo", "Archivo subido correctamente ✅", false);

      } catch (err) {
        console.error(err);
        alert("Error al subir el archivo: " + err.message);
      } finally {
        if (btnSubmit) { btnSubmit.textContent = "Guardar archivo"; btnSubmit.disabled = false; }
      }
    });
  }

  // Modal preview — cerrar
  document.getElementById("btn-cerrar-preview")
    ?.addEventListener("click", () => cerrarModal("modal-preview"));

  await renderSidebar();
  renderContenido();
}

function toggleFormSemana() {
  var form = document.getElementById("form-semana-inline");
  if (!form) return;
  mostrandoFormSemana = !mostrandoFormSemana;
  form.style.display = mostrandoFormSemana ? "block" : "none";
  if (mostrandoFormSemana) document.getElementById("input-nombre-semana")?.focus();
}

function ocultarFormSemana() {
  var form = document.getElementById("form-semana-inline");
  if (form) form.style.display = "none";
  mostrandoFormSemana = false;
}

async function renderSidebar() {
  var lista = document.getElementById("lista-semanas");
  if (!lista) return;

  lista.innerHTML = '<div class="sidebar-empty">Cargando...</div>';
  var semanas = await obtenerSemanas();

  if (semanas.length === 0) {
    lista.innerHTML = '<div class="sidebar-empty">No hay semanas aún.</div>';
    return;
  }

  var html = "";
  for (var i = 0; i < semanas.length; i++) {
    var s = semanas[i];
    var activa = (semanaSeleccionadaId === s.id) ? " activa" : "";
    html += '<div class="semana-item' + activa + '" data-id="' + s.id + '">';
    html += '<span class="semana-nombre">' + s.nombre + '</span>';
    html += '<div class="semana-acciones">';
    html += '<button class="btn-icono btn-del-semana" data-id="' + s.id + '" title="Eliminar">✕</button>';
    html += '</div>';
    html += '</div>';
  }
  lista.innerHTML = html;

  lista.querySelectorAll(".semana-item").forEach(function(item) {
    item.addEventListener("click", async function(e) {
      if (e.target.classList.contains("btn-del-semana")) return;
      semanaSeleccionadaId = parseInt(this.getAttribute("data-id"));
      await renderSidebar();
      await renderContenido();
    });
  });

  lista.querySelectorAll(".btn-del-semana").forEach(function(btn) {
    btn.addEventListener("click", async function(e) {
      e.stopPropagation();
      var id = parseInt(this.getAttribute("data-id"));
      if (!confirm("¿Eliminar esta semana y todos sus archivos?")) return;
      if (semanaSeleccionadaId === id) semanaSeleccionadaId = null;
      await eliminarSemana(id);
      await renderSidebar();
      await renderContenido();
    });
  });
}

async function renderContenido() {
  var contenido = document.getElementById("contenido-principal");
  if (!contenido) return;

  if (!semanaSeleccionadaId) {
    contenido.innerHTML =
      '<div class="main-placeholder">' +
      '<div class="icono-grande">📂</div>' +
      '<p>Seleccione una semana del panel izquierdo<br>o cree una nueva para comenzar.</p>' +
      '</div>';
    return;
  }

  mostrarCargando("contenido-principal", "Cargando archivos...");
  var semana = await obtenerSemana(semanaSeleccionadaId);

  if (!semana) {
    semanaSeleccionadaId = null;
    renderContenido();
    return;
  }

  var html = '<div class="semana-header">';
  html += '<h2>' + semana.nombre + '</h2>';
  html += '<button class="btn-primario" id="btn-agregar-archivo">+ Agregar archivo</button>';
  html += '</div>';
  html += '<div id="mensaje-archivo" class="mensaje"></div>';
  html += '<table class="tabla-archivos"><thead><tr>';
  html += '<th>Tipo</th><th>Nombre del archivo</th><th>Fecha</th><th>Acciones</th>';
  html += '</tr></thead><tbody>';

  if (semana.archivos.length === 0) {
    html += '<tr class="tabla-vacia"><td colspan="4">No hay archivos en esta semana. Haga clic en "+ Agregar archivo".</td></tr>';
  } else {
    semana.archivos.forEach(function(a) {
      html += '<tr>';
      html += '<td>' + obtenerBadgeTipo(a.tipo) + '</td>';
      html += '<td>' + obtenerIconoTipo(a.tipo) + ' ' + a.nombre + '</td>';
      html += '<td>' + a.fecha + '</td>';
      html += '<td><div class="acciones-td">';
      html += '<button class="btn-ver" data-archivo-id="' + a.id + '">👁 Ver</button>';
      html += '<button class="btn-eliminar" data-archivo-id="' + a.id + '">🗑 Eliminar</button>';
      html += '</div></td>';
      html += '</tr>';
    });
  }

  html += '</tbody></table>';
  contenido.innerHTML = html;

  // Botón agregar archivo
  document.getElementById("btn-agregar-archivo")
    ?.addEventListener("click", function() {
      if (!semanaSeleccionadaId) { alert("Seleccione una semana primero."); return; }
      var form = document.getElementById("form-archivo");
      if (form) form.reset();
      abrirModal("modal-archivo");
    });

  // Botones Ver
  contenido.querySelectorAll(".btn-ver").forEach(function(btn) {
    btn.addEventListener("click", async function() {
      var aid = parseInt(this.getAttribute("data-archivo-id"));
      var sem = await obtenerSemana(semanaSeleccionadaId);
      if (!sem) return;
      var archivo = sem.archivos.find(function(a) { return a.id === aid; });
      if (archivo) abrirPreview(archivo);
    });
  });

  // Botones Eliminar
  contenido.querySelectorAll(".btn-eliminar").forEach(function(btn) {
    btn.addEventListener("click", async function() {
      var aid = parseInt(this.getAttribute("data-archivo-id"));
      if (!confirm("¿Eliminar este archivo?")) return;
      await eliminarArchivo(semanaSeleccionadaId, aid);
      await renderContenido();
      mostrarMensaje("mensaje-archivo", "Archivo eliminado correctamente.", false);
    });
  });
}

// =============================================
// DASHBOARD USUARIO (solo lectura)
// =============================================
var semanaSeleccionadaIdUsuario = null;

async function initUsuario() {
  var sesion = protegerPagina("usuario");
  if (!sesion) return;

  var elNombre = document.getElementById("nombre-usuario");
  if (elNombre) elNombre.textContent = sesion.nombre;

  document.getElementById("btn-logout")
    ?.addEventListener("click", cerrarSesion);

  document.getElementById("btn-cerrar-preview")
    ?.addEventListener("click", () => cerrarModal("modal-preview"));

  await renderSidebarUsuario();
  renderContenidoUsuario();
}

async function renderSidebarUsuario() {
  var lista = document.getElementById("lista-semanas");
  if (!lista) return;

  lista.innerHTML = '<div class="sidebar-empty">Cargando...</div>';
  var semanas = await obtenerSemanas();

  if (semanas.length === 0) {
    lista.innerHTML = '<div class="sidebar-empty">No hay contenido disponible aún.</div>';
    return;
  }

  var html = "";
  semanas.forEach(function(s) {
    var activa = (semanaSeleccionadaIdUsuario === s.id) ? " activa" : "";
    html += '<div class="semana-item' + activa + '" data-id="' + s.id + '">';
    html += '<span class="semana-nombre">' + s.nombre + '</span>';
    html += '<span style="font-size:11px;color:#9ca3af">' + s.archivos.length + ' arch.</span>';
    html += '</div>';
  });
  lista.innerHTML = html;

  lista.querySelectorAll(".semana-item").forEach(function(item) {
    item.addEventListener("click", async function() {
      semanaSeleccionadaIdUsuario = parseInt(this.getAttribute("data-id"));
      await renderSidebarUsuario();
      await renderContenidoUsuario();
    });
  });
}

async function renderContenidoUsuario() {
  var contenido = document.getElementById("contenido-principal");
  if (!contenido) return;

  if (!semanaSeleccionadaIdUsuario) {
    contenido.innerHTML =
      '<div class="main-placeholder">' +
      '<div class="icono-grande">📖</div>' +
      '<p>Seleccione una semana del panel izquierdo<br>para ver los materiales disponibles.</p>' +
      '</div>';
    return;
  }

  mostrarCargando("contenido-principal", "Cargando archivos...");
  var semana = await obtenerSemana(semanaSeleccionadaIdUsuario);

  if (!semana) {
    semanaSeleccionadaIdUsuario = null;
    renderContenidoUsuario();
    return;
  }

  var html = '<div class="semana-header">';
  html += '<h2> ' + semana.nombre + '</h2>';
  html += '<span style="font-size:13px;color:#6b7280">Solo lectura</span>';
  html += '</div>';
  html += '<table class="tabla-archivos"><thead><tr>';
  html += '<th>Tipo</th><th>Nombre del archivo</th><th>Fecha</th><th>Ver</th>';
  html += '</tr></thead><tbody>';

  if (semana.archivos.length === 0) {
    html += '<tr class="tabla-vacia"><td colspan="4">No hay archivos en esta semana todavía.</td></tr>';
  } else {
    semana.archivos.forEach(function(a) {
      html += '<tr>';
      html += '<td>' + obtenerBadgeTipo(a.tipo) + '</td>';
      html += '<td>' + obtenerIconoTipo(a.tipo) + ' ' + a.nombre + '</td>';
      html += '<td>' + a.fecha + '</td>';
      html += '<td><button class="btn-ver" data-archivo-id="' + a.id + '">👁 Ver</button></td>';
      html += '</tr>';
    });
  }

  html += '</tbody></table>';
  contenido.innerHTML = html;

  contenido.querySelectorAll(".btn-ver").forEach(function(btn) {
    btn.addEventListener("click", async function() {
      var aid = parseInt(this.getAttribute("data-archivo-id"));
      var sem = await obtenerSemana(semanaSeleccionadaIdUsuario);
      if (!sem) return;
      var archivo = sem.archivos.find(function(a) { return a.id === aid; });
      if (archivo) abrirPreview(archivo);
    });
  });
}

// =============================================
// MODAL PREVISUALIZACIÓN
// =============================================
function abrirPreview(archivo) {
  var titulo = document.getElementById("preview-titulo");
  var area   = document.getElementById("preview-area");
  if (!titulo || !area) return;

  titulo.textContent = archivo.nombre;
  area.innerHTML = "";

  if (archivo.tipo === "pdf" && archivo.url) {
    area.innerHTML = '<iframe src="' + archivo.url + '" style="width:100%;height:70vh;border:none;"></iframe>';
  } else if (archivo.tipo === "imagen" && archivo.url) {
    area.innerHTML = '<img src="' + archivo.url + '" alt="' + archivo.nombre + '" style="max-width:100%;max-height:70vh;display:block;margin:auto;">';
  } else if (archivo.url) {
    area.innerHTML =
      '<div class="preview-sin-soporte">' +
      '<span class="icono">' + obtenerIconoTipo(archivo.tipo) + '</span>' +
      '<p><strong>' + archivo.nombre + '</strong><br>' +
      'Este tipo de archivo no tiene previsualización.<br>' +
      '<a href="' + archivo.url + '" target="_blank" style="color:#2563eb;text-decoration:underline;">Descargar / Abrir archivo</a></p>' +
      '</div>';
  } else {
    area.innerHTML =
      '<div class="preview-sin-soporte">' +
      '<span class="icono">' + obtenerIconoTipo(archivo.tipo) + '</span>' +
      '<p>No hay URL disponible para este archivo.</p>' +
      '</div>';
  }

  abrirModal("modal-preview");
}

// =============================================
// UTILIDADES MODAL
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
  document.querySelectorAll(".modal-overlay.visible").forEach(function(modal) {
    if (e.target === modal) modal.classList.remove("visible");
  });
});
