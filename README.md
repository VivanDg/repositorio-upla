# Repositorio Académico - UPLA
**Universidad Peruana Los Andes | Huancayo, Perú**

---

## Descripción
Sistema web sencillo para gestionar trabajos académicos organizados por semanas.
Desarrollado con HTML, CSS y JavaScript puro (sin frameworks).

---

## Estructura del proyecto

```
/project
│
├── index.html              ← Página de login
├── README.md               ← Este archivo
│
├── /css
│   └── styles.css          ← Estilos del sistema
│
├── /js
│   └── app.js              ← Lógica principal (auth + CRUD + UI)
│
├── /admin
│   └── dashboard.html      ← Panel de administrador
│
└── /user
    └── dashboard.html      ← Panel de usuario (solo lectura)
```

---

## Cómo usar

### 1. Abrir el proyecto
Abra el archivo `index.html` en su navegador web.
> Recomendado: usar Live Server en VS Code para evitar problemas con rutas.

### 2. Credenciales de prueba

| Usuario   | Contraseña | Rol           |
|-----------|------------|---------------|
| admin     | admin123   | Administrador |
| alumno    | upla2024   | Alumno        |
| docente   | docente1   | Invitado      |

---

## Funcionalidades

### Administrador
- ✅ Crear semanas (Semana 1, Semana 2, etc.)
- ✅ Eliminar semanas
- ✅ Agregar archivos a cada semana (nombre + tipo + URL opcional)
- ✅ Eliminar archivos
- ✅ Previsualizar PDFs (si tiene URL)
- ✅ Previsualizar imágenes (si tiene URL)

### Usuario (solo lectura)
- ✅ Ver lista de semanas
- ✅ Ver archivos por semana
- ✅ Previsualizar archivos

---

## Tecnologías usadas
- HTML5
- CSS3 (sin frameworks)
- JavaScript puro (ES5 compatible)
- LocalStorage (como base de datos)

---

## Agregar el logo de UPLA
En los archivos HTML, busque el comentario:
```html
<!-- Logo UPLA: reemplaza con <img src="../img/logo-upla.png" alt="UPLA"> -->
```
Cree una carpeta `/img` y coloque el logo con el nombre `logo-upla.png`.

---

## Notas
- Los datos se guardan en el navegador (LocalStorage)
- Si limpia el caché del navegador, se borran los datos
- No tiene backend ni base de datos real
- Proyecto desarrollado con fines académicos

---

*Desarrollado para el curso - UPLA 2024*
