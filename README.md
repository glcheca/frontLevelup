# LevelUp — Frontend

SPA en Vue 3 + TypeScript para la app de productividad académica LevelUp.

## Stack

- Vue 3 + TypeScript + Vite
- Vue Router + Pinia
- TanStack Query (estado de servidor)
- Tailwind CSS 4
- Axios con refresh automático
- zod para validación de formularios
- `marked` + `DOMPurify` para renderizar y sanear los apuntes en markdown

## Requisitos

- Node.js 20+ (probado con 26)
- El backend corriendo en `http://localhost:8080`

## Puesta en marcha

```powershell
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Vite redirige `/api` al backend,
así que no hay CORS en desarrollo.

## Scripts

| Comando           | Descripción                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                 |
| `npm run build`   | Chequeo de tipos + build de producción |
| `npm run preview` | Sirve el build                         |
| `npm test`        | Tests unitarios con Vitest             |
| `npm run lint`    | ESLint                                 |
| `npm run format`  | Prettier                               |

## Estructura

```
src/
├─ api/          cliente Axios, token en memoria, endpoints y claves de caché
├─ components/   ui, courses, events, tasks, notes, grades, notifications, reminders, search
├─ composables/  tema, toasts y atajo «nuevo»
├─ layouts/      AppLayout (sidebar, campanita y command palette) y AuthLayout
├─ pages/        login, registro, dashboard, cursos, detalle, calendario, eventos, tareas, apuntes, notas, ajustes
├─ router/       rutas y guard de sesión
├─ stores/       auth (usuario + sesión)
├─ types/        modelos compartidos
├─ utils/        fechas (semana/mes, TZ, etiquetas) y markdown (render + resaltado)
└─ style.css     Tailwind + componentes base
```

## Módulos implementados

- **Etapa 0:** auth completa, layout responsive, tema claro/oscuro/sistema, CI.
- **Etapa 1:** cursos (CRUD, archivar, color), horario por bloques, eventos (rango, todo el día),
  tareas (subtareas, prioridad, vencimiento, completar optimista), calendario semana/mes y dashboard.
- **Etapa 2:** apuntes en markdown con autoguardado, búsqueda sin tildes, etiquetas, fijar y filtros
  en la URL; calificaciones ponderadas con promedio sobre 20, aviso de pesos, "qué necesito para X"
  y promedio por curso en el dashboard.
- **Etapa 3:** campanita de notificaciones con polling, recordatorios configurables por evento/tarea,
  búsqueda global con `Ctrl/Cmd + K`, ajustes (perfil, zona horaria, tema, contraseña y borrado de
  cuenta) y dashboard "Hoy" con próxima clase, avisos del día y curso en riesgo.
- **Etapa 4:** atajos (`N` nuevo, `?` ayuda, `Esc` cerrar), confirmaciones antes de borrar, tablas
  convertidas en tarjetas en móvil, foco atrapado y `aria-labelledby` en modales, skip link,
  contraste AA, `prefers-reduced-motion`, estados de error con reintento y metadatos de la app.

## Atajos de teclado

| Atajo                | Acción                                                               |
| -------------------- | -------------------------------------------------------------------- |
| `Ctrl` / `Cmd` + `K` | Abrir la búsqueda global                                             |
| `N`                  | Crear en la vista actual (curso, evento, tarea, apunte o evaluación) |
| `?`                  | Abrir la ayuda de atajos                                             |
| `Esc`                | Cerrar diálogos, menú lateral o búsqueda                             |

No se activan mientras escribes en un campo ni con un diálogo abierto. En el sidebar también hay un
botón «Atajos de teclado».

## Accesibilidad

- Skip link «Saltar al contenido» en el layout principal.
- Modales con `role="dialog"`, `aria-modal`, foco atrapado y restaurado al cerrar.
- Iconos decorativos con `aria-hidden` y botones de solo icono con `aria-label`.
- Contraste AA en claro y oscuro; `prefers-reduced-motion` desactiva animaciones.
- Navegación completa por teclado con foco visible en todos los controles.

## Sesión

- El **access token vive en memoria** (no en `localStorage`).
- El **refresh token viaja en cookie `HttpOnly`** gestionada por el backend.
- Al recargar, el guard llama a `/auth/refresh` una sola vez.
- Ante un `401`, Axios refresca y reintenta la petición original.

## Caché de servidor

TanStack Query guarda cursos, horario, eventos, tareas, apuntes, recordatorios y resúmenes de notas.
Al mutar un curso se invalidan las claves relacionadas, de modo que un cambio de color o nombre se
refleja en calendario, tareas, apuntes y dashboard sin recargar la página. El contador de
notificaciones se refresca cada 60 s (pausado si la pestaña está oculta).

## Despliegue

- `Dockerfile` multi-stage: `npm ci` + `npm run build` sobre Node 22 y nginx 1.27 para servir.
- `nginx.conf`: fallback a `index.html`, proxy `/api` al backend, gzip y cabeceras de seguridad
  (`CSP`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- En producción el backend no se expone: Caddy termina TLS y nginx proxya `/api`.

## Pendiente

- [x] Toggle de tema claro/oscuro/sistema
- [x] CI (lint + format + test + build) en verde
- [x] Tests con Vitest (`npm test`, 24 tests)
- [x] Validado contra PostgreSQL real vía proxy `/api`
- [x] Responsive (tablas → tarjetas), accesibilidad y atajos de teclado
- [x] Build de producción servido por nginx (artefacto listo)
- [ ] Despliegue público (pendiente de plataforma y credenciales)
- [ ] Arrastrar para seleccionar rangos en el calendario (backlog)
- [ ] Notificaciones push / PWA (backlog)
