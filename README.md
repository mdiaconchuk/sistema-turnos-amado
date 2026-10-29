# Sistema de Turnos — Consultorio Dr. Salvador Amado

## Tecnologías

- **Next.js** — Aplicación web y API.
- **React + TypeScript** — Desarrollo de la interfaz.
- **Tailwind CSS + shadcn/ui** — Componentes y estilos.
- **PostgreSQL (Supabase)** — Base de datos.
- **Supabase Auth** — Autenticación.
- **Vercel** — Despliegue de la aplicación.

## 1. Clonar el repositorio

Primero, instalar [Node.js](https://nodejs.org/) y [Git](https://git-scm.com/).

Abrir una terminal y ejecutar:

```bash
git clone https://github.com/mdiaconchuk/sistema-turnos-amado.git
cd sistema-turnos-amado
```

## 2. Cambiar a la rama de desarrollo

El proyecto utiliza las siguientes ramas:

- `main`: versión estable.
- `dev`: integración del trabajo en desarrollo.
- `feature/...`: funcionalidades individuales.

Después de clonar:

```bash
git fetch origin
git switch dev
git pull origin dev
```

**No trabajar directamente sobre `main`.**

## 3. Instalar dependencias

Dentro de la carpeta del proyecto:

```bash
npm install
```

Esto instala las dependencias definidas en `package.json`.

## 4. Ejecutar la aplicación

```bash
npm run dev
```

Abrir en el navegador:
http://localhost:3000

La aplicación se actualizará automáticamente al modificar el código.

## 6. Organización del proyecto

La aplicación utiliza Next.js con App Router.

La estructura general prevista es:

```text
src/
├── app/
│   ├── api/           # Endpoints del backend
│   ├── layout.tsx     # Layout principal
│   └── page.tsx       # Página inicial
├── components/        # Componentes de interfaz
└── lib/               # Utilidades y servicios
```

La estructura podrá evolucionar según las necesidades de implementación.

## 7. Responsabilidades

### Frontend - MD

- Construcción de las pantallas.
- Agenda y visualización de turnos.
- Formularios y componentes.
- Integración con los endpoints del backend.

### Backend

- Implementación de las tablas necesarias.
- Implementación de autenticación y permisos.
- Desarrollo de endpoints para la gestión de turnos.
- Validaciones de negocio y prevención de reservas duplicadas.

El backend se desarrolla dentro del mismo proyecto Next.js, principalmente mediante rutas de API y módulos de servidor.

## 8. Primeros pasos para el backend

Orden de trabajo sugerido:

1. Clonar el repositorio y ejecutar la aplicación localmente.
2. Leer la especificación de requisitos y la documentación de diseño.
3. Revisar las entidades y reglas de negocio necesarias.
4. Configurar el proyecto de Supabase para desarrollo.
7. Implementar autenticación y autorización.
8. Implementar progresivamente la gestión de turnos y disponibilidad.
9. Probar las validaciones, especialmente la prevención de turnos duplicados.
10. Subir los cambios mediante Pull Requests hacia `dev`.