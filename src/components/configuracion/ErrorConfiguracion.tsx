// Muestra errores de configuración y los turnos que impiden aplicar un cambio.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { mostrarFecha } from "@/lib/fechas";
import { ErrorApi } from "@/lib/api";

import type { PropiedadesErrorConfiguracion } from "@/types/interfaz";

// Muestra el error y los turnos que deben resolverse antes de aplicar el cambio.
export function ErrorConfiguracion({ error, mensaje = "", alReintentar }: PropiedadesErrorConfiguracion) {
  const texto = error?.message || mensaje;
  if (!texto) return null;
  const conflictos = error instanceof ErrorApi ? error.appointments : [];

  return (
    <Alert variant="destructive" className="aviso-error block p-3">
      <p>{texto}</p>
      {alReintentar && (
        <Button variant="outline" className="mt-3" onClick={alReintentar}>Reintentar</Button>
      )}
      {conflictos.length > 0 && (
        <>
          <p className="mt-3 font-medium">Resolvé estos turnos antes de aplicar la modificación:</p>
          <ul className="my-3 space-y-1">
            {conflictos.map((turno) => (
              <li key={turno.id}>
                {mostrarFecha(turno.date)} · {turno.startTime} · {turno.patientName} · {turno.status}
              </li>
            ))}
          </ul>
          <Link href="/dashboard/agenda" className="underline">Ir a Agenda</Link>
        </>
      )}
    </Alert>
  );
}
