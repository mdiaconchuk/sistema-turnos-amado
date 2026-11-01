// Consulta, edita y guarda los rangos de atención de la semana.

"use client";

import { useState, type SubmitEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ErrorConfiguracion } from "@/components/configuracion/ErrorConfiguracion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConsultaApi } from "@/hooks/useConsultaApi";
import { mensajeError, solicitar } from "@/lib/api";
import type { Rango, RespuestaHorarios } from "@/types/turnos";

const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Carga el horario semanal y permite editar y guardar sus rangos.
export function HorariosSemanales() {
  const consulta = useConsultaApi<RespuestaHorarios>("/api/schedule");
  const [guardando, establecerGuardando] = useState(false);
  const [error, establecerError] = useState<Error | null>(null);
  const [aviso, establecerAviso] = useState("");
  const rangos = consulta.datos?.ranges ?? null;

  // Edita una fila del horario local; todavía no envía cambios al backend.
  function cambiarRango(indice: number, cambios: Partial<Rango>) {
    if (!rangos) return;
    consulta.actualizarDatos({
      ranges: rangos.map((rango, posicion) => posicion === indice ? { ...rango, ...cambios } : rango),
    });
  }

  // Agrega una fila para completar un nuevo rango de atención.
  function agregarRango() {
    const nuevoRango: Rango = { weekday: 1, startTime: "", endTime: "", slotMinutes: 30 };
    consulta.actualizarDatos({ ranges: [...(rangos ?? []), nuevoRango] });
  }

  // Quita una fila de la edición local del horario.
  function quitarRango(indice: number) {
    if (rangos) consulta.actualizarDatos({ ranges: rangos.filter((_, posicion) => posicion !== indice) });
  }

  // Envía los rangos y muestra los conflictos si el backend rechaza el cambio.
  async function guardarHorarios(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando || !rangos) return;
    establecerGuardando(true);
    establecerError(null);
    establecerAviso("");

    try {
      const respuesta = await solicitar<RespuestaHorarios>("/api/schedule", {
        method: "PUT",
        body: JSON.stringify({ ranges: rangos }),
      });
      consulta.actualizarDatos(respuesta);
      establecerAviso("Horarios guardados correctamente.");
    } catch (error) {
      establecerError(error instanceof Error ? error : new Error(mensajeError(error)));
    } finally {
      establecerGuardando(false);
    }
  }

  return (
    <Card className="panel gap-0 space-y-4 overflow-visible p-6 text-base ring-0">
      <div>
        <h2 className="text-lg font-semibold">Horarios semanales</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Podés agregar varios rangos por día. Los días sin rangos quedan sin atención.
        </p>
      </div>
      <ErrorConfiguracion
        error={error}
        mensaje={consulta.error}
        alReintentar={rangos === null ? consulta.recargar : undefined}
      />
      {aviso && <Alert role="status" className="block rounded-lg border-0 bg-secondary p-3 text-sm">{aviso}</Alert>}
      {consulta.cargando && <p role="status">Cargando horarios…</p>}
      {rangos !== null && (
        <form onSubmit={guardarHorarios} className="space-y-4">
          <fieldset disabled={guardando} className="space-y-3">
            {rangos.map((rango, indice) => (
              <div key={indice} className="grid grid-cols-[1.3fr_1fr_1fr_1fr_auto] items-end gap-3">
                <Label className="campo grid leading-normal select-auto">
                  Día
                  <NativeSelect className="selector" value={rango.weekday} onChange={(evento) => cambiarRango(indice, { weekday: Number(evento.target.value) })}>
                    {diasSemana.map((nombre, dia) => <NativeSelectOption key={dia} value={dia}>{nombre}</NativeSelectOption>)}
                  </NativeSelect>
                </Label>
                <Label className="campo grid leading-normal select-auto">
                  Inicio
                  <Input type="time" required value={rango.startTime} onChange={(evento) => cambiarRango(indice, { startTime: evento.target.value })} />
                </Label>
                <Label className="campo grid leading-normal select-auto">
                  Fin
                  <Input type="time" required value={rango.endTime} onChange={(evento) => cambiarRango(indice, { endTime: evento.target.value })} />
                </Label>
                <Label className="campo grid leading-normal select-auto">
                  Minutos por turno
                  <Input
                    type="number"
                    min={5}
                    max={240}
                    step={1}
                    required
                    value={Number.isNaN(rango.slotMinutes) ? "" : rango.slotMinutes}
                    onChange={(evento) => cambiarRango(indice, { slotMinutes: evento.target.valueAsNumber })}
                  />
                </Label>
                <Button type="button" variant="destructive" aria-label={`Quitar rango ${indice + 1}`} onClick={() => quitarRango(indice)}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            {rangos.length === 0 && <p className="text-sm text-muted-foreground">No hay horarios configurados.</p>}
            <Button type="button" variant="outline" onClick={agregarRango}>
              <Plus />Agregar rango
            </Button>
          </fieldset>
          <div className="flex items-center justify-end border-t pt-4">
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar horarios"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
