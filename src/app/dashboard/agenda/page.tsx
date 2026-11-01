// Coordina la fecha, la vista y la disponibilidad de la agenda, y abre el formulario de turnos.

"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { AgendaDiaria, AgendaSemanal } from "@/components/agenda/VistasAgenda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormularioTurno } from "@/components/agenda/FormularioTurno";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useConsultaApi } from "@/hooks/useConsultaApi";
import { hoyArgentina, sumarDias } from "@/lib/fechas";
import type { Dia, Espacio, RespuestaDisponibilidad } from "@/types/turnos";
import type { VistaAgenda, SeleccionTurno } from "@/types/interfaz";

// Carga la agenda del período elegido y abre las operaciones sobre sus espacios.
export default function Agenda() {
  const [fecha, establecerFecha] = useState(hoyArgentina);
  const [vista, establecerVista] = useState<VistaAgenda>("dia");
  const [aviso, establecerAviso] = useState("");
  const [seleccion, establecerSeleccion] = useState<SeleccionTurno | null>(null);
  const diaSemana = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  const desde = vista === "dia" ? fecha : sumarDias(fecha, -((diaSemana + 6) % 7));
  const hasta = vista === "dia" ? fecha : sumarDias(desde, 6);
  const saltoDias = vista === "dia" ? 1 : 7;
  const { datos, cargando, error, recargar } = useConsultaApi<RespuestaDisponibilidad>(
    `/api/availability?from=${desde}&to=${hasta}`, 2500,
  );
  const dias = datos?.days ?? [];

  // Cambia la fecha de consulta y actualiza los datos visibles.
  function seleccionarFecha(nuevaFecha: string) {
    if (!nuevaFecha) return;
    establecerFecha(nuevaFecha);
    establecerAviso("");
    recargar();
  }

  // Abre una reserva nueva o carga el turno que ocupa el espacio seleccionado.
  function abrirEspacio(dia: Dia, espacio: Espacio) {
    const seleccion: SeleccionTurno = { fecha: dia.date, hora: espacio.startTime };
    if (espacio.appointment && espacio.status !== "libre") {
      seleccion.turno = { ...espacio.appointment, date: dia.date, startTime: espacio.startTime, status: espacio.status };
    }
    establecerSeleccion(seleccion);
  }

  // Cierra el diálogo y limpia el turno seleccionado.
  function cerrarFormulario() {
    establecerSeleccion(null);
  }

  // Confirma la operación en pantalla y vuelve a consultar la disponibilidad.
  function finalizarOperacion() {
    cerrarFormulario();
    establecerAviso("Operación guardada correctamente.");
    recargar();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda de turnos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Disponibilidad y atención del consultorio</p>
        </div>
        <Button onClick={() => establecerSeleccion({ fecha, hora: "" })}>
          <Plus />Nuevo turno
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Label className="campo grid leading-normal select-auto">
          Fecha
          <Input type="date" required value={fecha} onChange={(evento) => seleccionarFecha(evento.target.value)} />
        </Label>
        <Button
          variant="outline"
          aria-label={vista === "dia" ? "Día anterior" : "Semana anterior"}
          onClick={() => seleccionarFecha(sumarDias(fecha, -saltoDias))}
        >
          <ChevronLeft />
        </Button>
        <Button variant="outline" onClick={() => seleccionarFecha(hoyArgentina())}>Hoy</Button>
        <Button
          variant="outline"
          aria-label={vista === "dia" ? "Día siguiente" : "Semana siguiente"}
          onClick={() => seleccionarFecha(sumarDias(fecha, saltoDias))}
        >
          <ChevronRight />
        </Button>
        <div className="ml-3 flex gap-1">
          <Button variant={vista === "dia" ? "default" : "outline"} aria-pressed={vista === "dia"} onClick={() => establecerVista("dia")}>
            Día
          </Button>
          <Button variant={vista === "semana" ? "default" : "outline"} aria-pressed={vista === "semana"} onClick={() => establecerVista("semana")}>
            Semana
          </Button>
        </div>
        <Button className="ml-auto" variant="outline" disabled={cargando} onClick={recargar}>
          <RefreshCw />Actualizar
        </Button>
      </div>
      {aviso && <Alert role="status" className="block rounded-lg border-0 bg-secondary p-3 text-sm">{aviso}</Alert>}
      {error && (
        <Alert variant="destructive" className="aviso-error block p-3">
          <p>{error} La información puede estar desactualizada.</p>
          <Button variant="outline" className="mt-2" onClick={recargar}>Reintentar</Button>
        </Alert>
      )}
      {cargando && <p role="status">Cargando disponibilidad…</p>}
      {!cargando && vista === "dia" && dias[0] && (
        <AgendaDiaria dia={dias[0]} deshabilitada={!!error} alSeleccionar={abrirEspacio} />
      )}
      {!cargando && vista === "semana" && dias.length > 0 && (
        <AgendaSemanal dias={dias} deshabilitada={!!error} alSeleccionar={abrirEspacio} />
      )}
      {seleccion && (
        <FormularioTurno
          turno={seleccion.turno}
          fechaInicial={seleccion.fecha}
          horaInicial={seleccion.hora}
          alCerrar={cerrarFormulario}
          alActualizar={recargar}
          alGuardar={finalizarOperacion}
        />
      )}
    </>
  );
}
