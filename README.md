# Repositorio Académico - UPLA
**Universidad Peruana Los Andes | Huancayo, Perú**

---

## Descripción
Sistema web para gestionar trabajos académicos semanales. Permite al administrador subir archivos por semana y a los alumnos visualizarlos en modo solo lectura. Desarrollado con HTML, CSS y JavaScript puro; usa Supabase como base de datos y almacenamiento en la nube.

---

## Estructura del proyecto

```
repositorio-upla/
├── index.html              ← Página de login
├── dashboard.html          ← Panel de administrador
├── dashboardalumno.html    ← Panel de alumno / visitante (solo lectura)
├── app.js                  ← Lógica principal (auth + CRUD + UI + Supabase)
├── styles.css              ← Estilos del sistema
└── README.md
```

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 · CSS3 · JavaScript (ES2020) |
| Base de datos | [Supabase](https://supabase.com) — tablas `semanas` y `archivos` |
| Almacenamiento | Supabase Storage — bucket `archivos` |
| Hosting | Vercel |

---

## Credenciales de prueba

| Usuario    | Contraseña | Rol           |
|------------|------------|---------------|
| `admin`    | `vivand123` | Administrador |
| `visitante`| `upla2024`  | Alumno        |
| `docente`  | `docente1`  | Invitado      |

---

## Funcionalidades

### Administrador
- Crear y eliminar semanas
- Subir archivos a cada semana (PDF, imagen, Excel, otros) vía Supabase Storage
- Previsualizar PDFs e imágenes directamente en el navegador
- Eliminar archivos

### Alumno / Visitante (solo lectura)
- Ver lista de semanas disponibles
- Ver archivos por semana
- Previsualizar o descargar archivos

---

## Cómo usar

1. Abrir `index.html` en el navegador (o acceder al dominio desplegado en Vercel).
2. Iniciar sesión con alguna de las credenciales de prueba.
3. El sistema redirige automáticamente al panel correspondiente según el rol.

---

## Variables de entorno / configuración Supabase

Las credenciales de Supabase están definidas en `app.js`:

```js
const SUPABASE_URL = "<tu-project-url>";
const SUPABASE_KEY = "<tu-anon-key>";
```

Para un despliegue propio, reemplaza esos valores con los de tu proyecto en Supabase.

---

*Desarrollado para el curso — UPLA 2024*
