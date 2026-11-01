// Reúne las secciones de horarios semanales y fechas bloqueadas.

import { HorariosSemanales } from "@/components/configuracion/HorariosSemanales";
import { FechasBloqueadas } from "@/components/configuracion/FechasBloqueadas";

// Muestra las secciones de horarios semanales y fechas bloqueadas.
export default function Configuracion() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Horarios de atención y fechas sin actividad</p>
      </div>
      <HorariosSemanales />
      <FechasBloqueadas />
    </>
  );
}
