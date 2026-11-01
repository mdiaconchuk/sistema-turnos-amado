# Frontend del consultorio

Interfaz de gestión de turnos desarrollada con Next.js, React, TypeScript, Tailwind CSS y shadcn/ui. Se conecta a la API mediante `fetch` y utiliza sesiones por cookies.

## Pantallas

- **Login:** ingreso y redirección según el rol.
- **Agenda:** vistas diaria y semanal, disponibilidad y gestión de turnos.
- **Reportes:** consulta de pacientes atendidos por fecha.
- **Configuración:** horarios semanales y fechas bloqueadas.

La secretaria accede a las tres secciones del dashboard. El facturista accede únicamente a Reportes.

## Organización

- `src/app`: páginas y estructura de navegación.
- `src/components`: componentes de las pantallas y controles de shadcn/ui.
- `src/hooks/useConsultaApi.ts`: carga, errores y actualización de consultas.
- `src/lib/api.ts` y `src/lib/fechas.ts`: solicitudes HTTP y manejo de fechas.
- `src/types`: tipos de datos y propiedades de los componentes.

## Ejecutar

Con las variables de Supabase configuradas en `.env.local`:

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000/login` e ingresar el nombre de usuario sin `@test.com`.
