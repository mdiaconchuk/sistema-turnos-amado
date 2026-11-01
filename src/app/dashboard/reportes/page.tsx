// Consulta y muestra los pacientes atendidos en la fecha seleccionada.

"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { useConsultaApi } from "@/hooks/useConsultaApi";
import { hoyArgentina, mostrarFecha } from "@/lib/fechas";
import type { RespuestaReporte } from "@/types/turnos";

// Consulta y muestra los pacientes atendidos en la fecha seleccionada.
export default function ReporteAtendidos() {
  const [fecha, establecerFecha] = useState(hoyArgentina);
  const { datos, cargando, error, recargar } = useConsultaApi<RespuestaReporte>(`/api/reports/attended?date=${fecha}`, 2500);
  const atendidos = datos?.items ?? [];

  // Cambia la fecha de consulta y actualiza los datos visibles.
  function seleccionarFecha(nuevaFecha: string) {
    if (nuevaFecha) establecerFecha(nuevaFecha);
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Reporte de atendidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pacientes con atención registrada en la fecha seleccionada
        </p>
      </div>
      <div className="flex items-end gap-3">
        <Label className="campo grid leading-normal select-auto">
          Fecha
          <Input type="date" required value={fecha} onChange={(evento) => seleccionarFecha(evento.target.value)} />
        </Label>
        <Button variant="outline" disabled={cargando} onClick={recargar}>Actualizar</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="aviso-error block p-3">
          <p>{error}</p>
          <Button variant="outline" className="mt-2" onClick={recargar}>Reintentar</Button>
        </Alert>
      )}
      {cargando && <p role="status">Cargando reporte…</p>}
      {!cargando && !error && atendidos.length === 0 && (
        <Card className="panel gap-0 p-6 text-sm text-muted-foreground ring-0">No hay pacientes atendidos en esta fecha.</Card>
      )}
      {!cargando && !error && atendidos.length > 0 && (
        <Card className="gap-0 overflow-hidden rounded-xl border bg-card p-0 text-base ring-0">
          <Table className="tabla">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Nombre completo</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Obra social</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendidos.map((paciente) => (
                <TableRow key={`${paciente.date}-${paciente.startTime}`}>
                  <TableCell>{mostrarFecha(paciente.date)}</TableCell>
                  <TableCell>{paciente.startTime}</TableCell>
                  <TableCell>{paciente.patientName}</TableCell>
                  <TableCell>{paciente.dni}</TableCell>
                  <TableCell>{paciente.obraSocial}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
