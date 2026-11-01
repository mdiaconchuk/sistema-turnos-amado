// Consulta, agrega y elimina bloqueos de fechas, mostrando los conflictos del backend.

"use client";

import { useState, type SubmitEvent } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ErrorConfiguracion } from "@/components/configuracion/ErrorConfiguracion";
import { useConsultaApi } from "@/hooks/useConsultaApi";
import { mensajeError, solicitar } from "@/lib/api";
import type { Bloqueo, RespuestaBloqueos } from "@/types/turnos";

// Muestra los bloqueos y permite agregarlos o eliminarlos mediante la API.
export function FechasBloqueadas() {
  const consulta = useConsultaApi<RespuestaBloqueos>("/api/blocked-dates");
  const [guardando, establecerGuardando] = useState(false);
  const [error, establecerError] = useState<Error | null>(null);
  const [aviso, establecerAviso] = useState("");
  const bloqueos = consulta.datos?.dates ?? null;

  // Envía el bloqueo y limpia el formulario solo cuando el backend lo confirma.
  async function bloquearFecha(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando || !bloqueos) return;
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    establecerGuardando(true);
    establecerError(null);
    establecerAviso("");

    try {
      const bloqueo = await solicitar<Bloqueo>("/api/blocked-dates", {
        method: "POST",
        body: JSON.stringify({ date: datos.get("date"), reason: datos.get("reason") }),
      });
      consulta.actualizarDatos({ dates: [...bloqueos, bloqueo].sort((a, b) => a.date.localeCompare(b.date)) });
      formulario.reset();
      establecerAviso("Fecha bloqueada correctamente.");
    } catch (error) {
      establecerError(error instanceof Error ? error : new Error(mensajeError(error)));
    } finally {
      establecerGuardando(false);
    }
  }

  // Elimina el bloqueo y actualiza la lista después de la respuesta del backend.
  async function desbloquearFecha(fecha: string) {
    if (guardando || !bloqueos) return;
    establecerGuardando(true);
    establecerError(null);
    establecerAviso("");

    try {
      await solicitar(`/api/blocked-dates/${fecha}`, { method: "DELETE" });
      consulta.actualizarDatos({ dates: bloqueos.filter((bloqueo) => bloqueo.date !== fecha) });
      establecerAviso("Bloqueo eliminado correctamente.");
    } catch (error) {
      establecerError(error instanceof Error ? error : new Error(mensajeError(error)));
    } finally {
      establecerGuardando(false);
    }
  }

  return (
    <Card className="panel gap-0 space-y-4 overflow-visible p-6 text-base ring-0">
      <h2 className="text-lg font-semibold">Fechas bloqueadas</h2>
      <ErrorConfiguracion
        error={error}
        mensaje={consulta.error}
        alReintentar={bloqueos === null ? consulta.recargar : undefined}
      />
      {aviso && <Alert role="status" className="block rounded-lg border-0 bg-secondary p-3 text-sm">{aviso}</Alert>}
      {consulta.cargando && <p role="status">Cargando fechas bloqueadas…</p>}

      {bloqueos !== null && (
        <>
          <form onSubmit={bloquearFecha}>
            <fieldset disabled={guardando} className="flex items-end gap-3">
              <Label className="campo grid leading-normal select-auto">
                Fecha
                <Input type="date" name="date" required />
              </Label>
              <Label className="campo grid leading-normal select-auto flex-1">
                Motivo (opcional)
                <Input name="reason" placeholder="Por ejemplo, vacaciones" />
              </Label>
              <Button type="submit">{guardando ? "Procesando…" : "Bloquear fecha"}</Button>
            </fieldset>
          </form>

          {bloqueos.length === 0 && <p className="text-sm text-muted-foreground">No hay fechas bloqueadas.</p>}
          {bloqueos.length > 0 && (
            <Table className="tabla">
              <TableHeader>
                <TableRow><TableHead>Fecha</TableHead><TableHead>Motivo</TableHead><TableHead>Acciones</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {bloqueos.map((bloqueo) => (
                  <TableRow key={bloqueo.date}>
                    <TableCell>{bloqueo.date}</TableCell>
                    <TableCell>{bloqueo.reason ?? "Sin motivo indicado"}</TableCell>
                    <TableCell>
                      <Button variant="outline" disabled={guardando} onClick={() => desbloquearFecha(bloqueo.date)}>
                        Eliminar bloqueo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </Card>
  );
}
