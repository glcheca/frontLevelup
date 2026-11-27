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
├─ components/   ui (modal, empty state, skeleton), courses, events, tasks, notes, grades
├─ composables/  tema, toasts
├─ layouts/      AppLayout (sidebar) y AuthLayout
├─ pages/        login, registro, dashboard, cursos, detalle, calendario, eventos, tareas, apuntes, notas
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

## Sesión

- El **access token vive en memoria** (no en `localStorage`).
- El **refresh token viaja en cookie `HttpOnly`** gestionada por el backend.
- Al recargar, el guard llama a `/auth/refresh` una sola vez.
- Ante un `401`, Axios refresca y reintenta la petición original.

## Caché de servidor

TanStack Query guarda cursos, horario, eventos, tareas, apuntes y resúmenes de notas. Al mutar un
curso se invalidan las claves relacionadas, de modo que un cambio de color o nombre se refleja en
calendario, tareas, apuntes y dashboard sin recargar la página.

## Pendiente

- [x] Toggle de tema claro/oscuro/sistema
- [x] CI (lint + format + test + build) en verde
- [x] Tests con Vitest (`npm test`, 21 tests)
- [x] Validado contra PostgreSQL real vía proxy `/api`
- [ ] Arrastrar para seleccionar rangos en el calendario (Etapa 4)
- [ ] Recordatorios in-app (Etapa 3)
