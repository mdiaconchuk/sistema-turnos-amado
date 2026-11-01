# Contrato de API — Sistema de turnos Dr. Amado (BORRADOR a validar con frontend)

## Convenciones
- Todas las rutas son `/api/...` y devuelven JSON. La sesión viaja en cookies: el frontend no guarda tokens.
- Fechas: `"YYYY-MM-DD"`. Horas: `"HH:mm"` (24 h). Siempre hora local del consultorio (Argentina), sin zona horaria.
- Campos en camelCase. `dni` siempre es texto (para conservar ceros).
- Estados: `reservado`, `atendido`, `ausente`, `cancelado`.
- Error: `{ "error": { "code": "...", "message": "...", "details": ... } }`.

| Status | code | Cuándo |
|---|---|---|
| 400 | VALIDATION_ERROR | Campos faltantes o inválidos |
| 401 | UNAUTHENTICATED / INVALID_CREDENTIALS | Sin sesión / login incorrecto |
| 403 | FORBIDDEN / NO_ROLE | Rol sin permiso |
| 404 | NOT_FOUND | El recurso no existe |
| 409 | SLOT_TAKEN | El horario ya está ocupado |
| 409 | INVALID_TRANSITION / INVALID_STATE | Cambio de estado no permitido / turno cancelado |
| 409 | CONFLICTS_PENDING | Hay turnos que resolver antes de aplicar el cambio (`details.appointments`) |
| 422 | SLOT_NOT_AVAILABLE | Fuera del horario de atención o fecha bloqueada |

## Permisos
- **secretaria**: todo.
- **facturista**: solo `GET /api/auth/me` y `GET /api/reports/attended`.

## Autenticación
- `POST /api/auth/login` `{ "username", "password" }` → `200 { "user": { "id", "username", "role" } }`
- `POST /api/auth/logout` → `200 { "ok": true }`
- `GET /api/auth/me` → `200 { "user": { "id", "role" } }` o `401`

## Agenda y disponibilidad
`GET /api/availability?from=2026-11-02&to=2026-11-08` (secretaria)
```json
{ "days": [ {
  "date": "2026-11-02",
  "blocked": false,
  "slots": [
    { "startTime": "09:00", "status": "libre" },
    { "startTime": "09:30", "status": "reservado",
      "appointment": { "id": 12, "patientName": "Ana Pérez", "dni": "30111222", "obraSocial": "OSDE", "phone": null } }
  ] } ] }
```
`status` del slot: `libre`, `reservado`, `atendido` o `ausente`. Los cancelados no aparecen: liberan el horario.

## Turnos (secretaria)
Objeto turno: `{ id, date, startTime, patientName, dni, obraSocial, phone, status }`

- `POST /api/appointments` `{ date, startTime, patientName, dni, obraSocial, phone? }` → `201 { appointment }` (409 `SLOT_TAKEN`, 422 `SLOT_NOT_AVAILABLE`)
- `PATCH /api/appointments/:id` con cualquiera de `date, startTime, patientName, dni, obraSocial, phone` → `200 { appointment }`
- `POST /api/appointments/:id/cancel` → `200 { "ok": true }`. Elimina físicamente el registro y libera el horario. Los registros cancelados anteriores no se eliminan automáticamente.
- `PATCH /api/appointments/:id/status` `{ "status": "reservado" | "atendido" | "ausente" }` → `200 { appointment }`
  - Cancelar no va por acá, sino por `/cancel`.
  - Reservado → atendido | ausente. Atendido ↔ ausente. Atendido | ausente → reservado. Sin validar fecha ni hora.

## Horario semanal (secretaria)
- `GET /api/schedule` → `{ "ranges": [ { "weekday": 1, "startTime": "09:00", "endTime": "12:00", "slotMinutes": 30 } ] }`. `weekday`: 0 = domingo … 6 = sábado.
- `PUT /api/schedule` con el mismo cuerpo reemplaza el patrón completo. Si deja turnos futuros fuera del nuevo horario → `409 CONFLICTS_PENDING` con `details.appointments`; no se guarda nada ni se cancela nada.

## Fechas bloqueadas (secretaria)
- `GET /api/blocked-dates` → `{ "dates": [ { "date": "2026-12-24", "reason": "Vacaciones" } ] }`
- `POST /api/blocked-dates` `{ date, reason? }` → `201`. Si ya hay turnos ese día → `409 CONFLICTS_PENDING` con `details.appointments`.
- `DELETE /api/blocked-dates/:date` → `200 { "ok": true }`

## Reporte (facturista y secretaria)
`GET /api/reports/attended?from=2026-10-01&to=2026-10-31` (o `?date=2026-10-31`)
```json
{ "items": [ { "date": "2026-10-30", "startTime": "09:30", "patientName": "Ana Pérez", "dni": "30111222", "obraSocial": "OSDE" } ] }
```

## Pendiente de acordar con el equipo
- Quién administra horarios y bloqueos (acá: solo secretaria).
- Reservas en fechas pasadas y anticipación máxima.
- Si un mismo DNI puede tener varios turnos pendientes.
- Exportar o imprimir el reporte.
