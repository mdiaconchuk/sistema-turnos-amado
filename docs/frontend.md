# Frontend del consultorio

El frontend usa las rutas `/api/...` y las cookies del backend existente. No guarda tokens o contraseñas ni genera disponibilidad propia.

## Mapa de archivos

| Tarea | Archivo |
| --- | --- |
| Login | `src/components/auth/LoginForm.tsx` |
| Sesión, navegación y logout | `src/app/dashboard/layout.tsx` |
| Fecha y selección de la agenda | `src/app/dashboard/agenda/page.tsx` |
| Vista diaria y semanal | `src/components/agenda/VistasAgenda.tsx` |
| Crear, editar, cambiar estado y cancelar | `src/components/agenda/FormularioTurno.tsx` |
| Reporte de atendidos | `src/app/dashboard/reportes/page.tsx` |
| Horarios semanales | `src/components/configuracion/HorariosSemanales.tsx` |
| Fechas bloqueadas | `src/components/configuracion/FechasBloqueadas.tsx` |
| Mensajes y turnos conflictivos | `src/components/configuracion/ErrorConfiguracion.tsx` |

Cada operación está escrita con `async/await` y `try/catch` en su componente. No hay un controlador de formulario ni un ejecutor genérico de operaciones. Los campos del paciente se agrupan en una función local del formulario, sin otro archivo ni múltiples props de coordinación.

Se conserva un único hook, `useConsultaApi`, porque cinco pantallas o formularios comparten la carga, los errores y la recarga. Agenda y Reportes lo usan con un intervalo de 2,5 segundos mientras la pestaña está visible. Cancela consultas anteriores al cambiar de URL y evita superponer solicitudes del intervalo.

`src/lib/api.ts` es el helper HTTP compartido y `src/lib/fechas.ts` maneja las fechas de la interfaz. Los datos del usuario están en `src/types/autenticacion.ts`; turnos, disponibilidad, configuración y reportes están en `src/types/turnos.ts`. `src/types/interfaz.ts` concentra las propiedades de los componentes y el estado de la consulta. Se mantienen los nombres JSON del backend y los tipos que describen sus respuestas.

Los comentarios de cabecera orientan sobre cada archivo. Los comentarios interiores se reservan para cuestiones como conservar el horario del propio turno o refrescar datos que cambió otra sesión.

## Backend protegido

El backend se mantuvo sin cambios durante la refactorización del frontend. Con autorización posterior se modificó exclusivamente la cancelación: `POST /api/appointments/:id/cancel` ahora elimina el registro de `appointments` y devuelve `{ "ok": true }`. Se actualizó el contrato para reflejarlo. No se modificaron otros endpoints, permisos, migraciones ni la conexión con Supabase; tampoco se borraron los cancelados que ya existían.

El backend sigue validando permisos, disponibilidad e integridad. Los errores de horario ocupado refrescan la agenda. Los conflictos de configuración muestran los turnos pendientes sin moverlos ni cancelarlos.

## Ejecutar

1. Instalar con `npm install` o `npm.cmd install` en PowerShell.
2. Completar `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`. La URL es la base del proyecto, sin `/rest/v1/`.
3. Confirmar con el responsable del backend que estén aplicadas las migraciones y asignados los roles en `profiles`.
4. Ejecutar `npm run dev`, abrir `/login` e ingresar el usuario sin `@test.com`.

## Verificaciones de esta refactorización

- Build, TypeScript y lint sin errores.
- Login y logout reales con secretaria y facturista. Cookies verificadas mediante `/api/auth/me`: 200 con sesión y 401 después del logout.
- Secretaria: 200 en disponibilidad, horarios, bloqueos y reporte de atendidos.
- Facturista: 200 en reporte; 403 en disponibilidad, horarios y bloqueos.
- Pruebas en memoria de los handlers reales: rutas y JSON de crear, editar, cambiar estado y cancelar; rechazo de horario ocupado sin confirmar la reserva; conflictos de horarios sin actualizar los datos guardados.
- Comparación de clases CSS, textos y atributos de los formularios antes y después: conservados.
- Comparación de los archivos protegidos antes y después y del backend con su rama original.

No se realizaron pruebas interactivas en navegador ni se guardaron, cancelaron o modificaron turnos reales para probar. La persistencia de esas operaciones requiere una comprobación en un entorno de pruebas; no se insertaron pacientes ficticios ni se cambió la configuración del consultorio.

## Revisión de los requisitos presentados

Las funciones están implementadas, pero las condiciones cuantitativas no se consideran certificadas solo por compilar.

| Requisito | Evidencia y límite |
| --- | --- |
| Registrar, modificar, cancelar y cambiar estados | Los handlers del frontend usan las rutas existentes. Se verificaron sus solicitudes en memoria; falta repetir el ciclo completo con persistencia en un entorno de pruebas. |
| Cancelar libera el horario | La cancelación usa `/cancel`, elimina el registro y recarga disponibilidad. Los registros cancelados anteriores permanecen excluidos de la agenda. |
| Agenda diaria/semanal con libres, reservas y atendidos | Las dos vistas muestran los slots y estados reales de `/api/availability`. |
| Reporte de atendidos del día o fechas anteriores | El selector consulta por fecha. La tabla contiene nombre, DNI y obra social. El backend filtra `atendido`. Se comprobaron el acceso y la respuesta reales; el día consultado no tenía resultados. |
| Roles y uso simultáneo | Se verificó login/logout de ambos roles, reportes con 200 y gestión con 403 para el facturista. El reporte es de solo lectura y las sesiones son independientes. No se ejecutó una prueba concurrente de carga o de doble reserva. |
| Máximo seis clics desde Agenda | Las rutas rápidas son cortas: reservar desde un espacio libre requiere unos 5 clics, o 6 con teléfono; editar un campo, 3; cancelar, 3. Contando también campos y opciones, crear desde «Nuevo turno» puede superar seis. No se certifica el máximo para todos los recorridos ni para los selectores nativos del navegador. |
| Actualización visual en hasta tres segundos | Tras guardar se recarga inmediatamente; otras sesiones se consultan cada 2,5 segundos. Al sumar latencia y renderizado puede exceder tres segundos. Falta medirlo bajo condiciones de uso definidas. |
| Escritorio mínimo 1366×768 | La distribución está orientada a escritorio, pero falta comprobar visualmente esa resolución, incluidos diálogo, grilla semanal y textos largos. |

En la agenda se muestra el día completo con formato `Domingo 01-11`. Las filas diarias activan fondos muy claros según su estado y conservan sus badges. Se retiró el texto auxiliar de guardado de horarios, sin cambiar el envío del patrón semanal completo.
