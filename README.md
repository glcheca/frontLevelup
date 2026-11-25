# LevelUp — Frontend

SPA en Vue 3 + TypeScript para la app de productividad académica LevelUp.

## Stack

- Vue 3 + TypeScript + Vite
- Vue Router + Pinia
- TanStack Query (estado de servidor)
- Tailwind CSS 4
- Axios con refresh automático
- zod para validación de formularios

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

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Chequeo de tipos + build de producción |
| `npm run preview` | Sirve el build |

## Estructura

```
src/
├─ api/         cliente Axios, token en memoria, endpoints
├─ layouts/     AppLayout (sidebar) y AuthLayout
├─ pages/       login, registro, dashboard y placeholders
├─ router/      rutas y guard de sesión
├─ stores/      auth (usuario + sesión)
├─ types/       modelos compartidos
└─ style.css    Tailwind + componentes base
```

## Sesión

- El **access token vive en memoria** (no en `localStorage`).
- El **refresh token viaja en cookie `HttpOnly`** gestionada por el backend.
- Al recargar, el guard llama a `/auth/refresh` una sola vez.
- Ante un `401`, Axios refresca y reintenta la petición original.

## Pendiente (Etapa 0)

- [ ] Toggle de tema claro/oscuro
- [ ] CI (lint + build)
- [ ] Tests con Vitest
