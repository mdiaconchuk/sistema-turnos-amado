// Muestra la disponibilidad diaria y semanal recibida del backend.

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { mostrarFecha } from "@/lib/fechas";
import type { PropiedadesAgendaDiaria, PropiedadesAgendaSemanal } from "@/types/interfaz";

// Presenta los espacios del día y permite seleccionar uno para reservar o editar.
export function AgendaDiaria({ dia, deshabilitada, alSeleccionar }: PropiedadesAgendaDiaria) {
  let mensaje = "";
  if (dia.blocked) {
    mensaje = "Fecha bloqueada: no hay atención.";
  } else if (dia.slots.length === 0) {
    mensaje = "No hay horarios de atención para esta fecha.";
  }

  return (
    <Card role="region" className="gap-0 overflow-hidden rounded-xl border bg-card p-0 text-base ring-0" aria-label="Agenda diaria">
      <h2 className="border-b px-4 py-3 font-semibold">{mostrarFecha(dia.date, true)}</h2>

      {mensaje && <p className="p-6 text-muted-foreground">{mensaje}</p>}

      {!mensaje && (
        <Table className="tabla">
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Obra social</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dia.slots.map((espacio) => (
              <TableRow key={espacio.startTime} data-estado={espacio.status}>
                <TableCell className="font-medium">{espacio.startTime}</TableCell>
                <TableCell>{espacio.appointment?.patientName ?? "Disponible"}</TableCell>
                <TableCell>{espacio.appointment?.dni ?? "—"}</TableCell>
                <TableCell>{espacio.appointment?.obraSocial ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`h-auto rounded-full px-3 py-1 text-xs font-normal capitalize estado-${espacio.status}`}>
                    {espacio.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant={espacio.status === "libre" ? "secondary" : "outline"}
                    disabled={deshabilitada}
                    onClick={() => alSeleccionar(dia, espacio)}
                  >
                    {espacio.status === "libre" ? "Reservar" : "Ver / editar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

// Distribuye los espacios recibidos en columnas por día y filas por hora.
export function AgendaSemanal({ dias, deshabilitada, alSeleccionar }: PropiedadesAgendaSemanal) {
  // Las filas salen de los espacios del backend, sin crear horarios propios.
  const horas = [...new Set(dias.flatMap((dia) => dia.slots.map((espacio) => espacio.startTime)))].sort();

  return (
    <Card role="region" className="gap-0 overflow-auto rounded-xl border bg-card p-0 text-base ring-0" aria-label="Agenda semanal">
      <Table className="tabla table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Hora</TableHead>
            {dias.map((dia) => <TableHead key={dia.date}>{mostrarFecha(dia.date, true)}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell />
            {dias.map((dia) => {
              let mensaje = "";
              if (dia.blocked) {
                mensaje = "Sin atención: fecha bloqueada";
              } else if (dia.slots.length === 0) {
                mensaje = "Sin horarios de atención";
              }

              return (
                <TableCell key={dia.date} className="text-xs text-muted-foreground">
                  {mensaje}
                </TableCell>
              );
            })}
          </TableRow>
          {horas.map((hora) => (
            <TableRow key={hora}>
              <TableCell className="align-top font-medium">{hora}</TableCell>
              {dias.map((dia) => {
                const espacio = dia.slots.find((item) => item.startTime === hora);

                if (!espacio) {
                  return (
                    <TableCell key={dia.date} className="text-center text-muted-foreground">—</TableCell>
                  );
                }

                return (
                  <TableCell key={dia.date} className="align-top !p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={deshabilitada}
                      onClick={() => alSeleccionar(dia, espacio)}
                      className={`block h-auto min-h-18 w-full rounded-md border p-2 text-left text-xs font-normal whitespace-normal focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 estado-${espacio.status}`}
                    >
                      <span className="block font-medium">
                        {espacio.appointment?.patientName ?? "Disponible"}
                      </span>
                      <span className="mt-1 block capitalize">{espacio.status}</span>
                    </Button>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
