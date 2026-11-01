// Crea o edita un turno y permite cambiar su estado o confirmar su cancelación.

"use client";

import { useState, type SubmitEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useConsultaApi } from "@/hooks/useConsultaApi";
import { ErrorApi, mensajeError, solicitar } from "@/lib/api";
import type { EstadoTurno, RespuestaDisponibilidad } from "@/types/turnos";
import type { PropiedadesFormularioTurno, PropiedadesPaciente } from "@/types/interfaz";

// Muestra los datos del turno y coordina su guardado, estado y cancelación.
export function FormularioTurno({ turno, fechaInicial, horaInicial, alCerrar, alActualizar, alGuardar }: PropiedadesFormularioTurno) {
  const [fecha, establecerFecha] = useState(turno?.date ?? fechaInicial);
  const [hora, establecerHora] = useState(turno?.startTime ?? horaInicial);
  const [estado, establecerEstado] = useState<EstadoTurno>(turno?.status ?? "reservado");
  const [confirmando, establecerConfirmando] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [error, establecerError] = useState("");
  const disponibilidad = useConsultaApi<RespuestaDisponibilidad>(`/api/availability?from=${fecha}&to=${fecha}`);
  const dia = disponibilidad.datos?.days[0];

  // Al editar se puede conservar el horario del propio turno.
  const espacios = dia?.slots.filter((espacio) => espacio.status === "libre" || espacio.appointment?.id === turno?.id) ?? [];
  const horaDisponible = espacios.some((espacio) => espacio.startTime === hora);
  const puedeGuardar = !guardando && !disponibilidad.cargando && !disponibilidad.error && horaDisponible;

  // Cambia la fecha de consulta y actualiza los datos visibles.
  function seleccionarFecha(nuevaFecha: string) {
    if (!nuevaFecha || nuevaFecha === fecha) return;
    establecerFecha(nuevaFecha);
    establecerHora("");
  }

  // Si otra sesión cambió el turno o tomó el horario, vuelve a consultar los datos reales.
  function mostrarError(causa: unknown) {
    establecerError(mensajeError(causa));
    if (causa instanceof ErrorApi && ["SLOT_TAKEN", "SLOT_NOT_AVAILABLE", "INVALID_STATE", "NOT_FOUND"].includes(causa.code)) {
      disponibilidad.recargar();
      alActualizar();
    }
  }

  // Valida los campos básicos y espera la confirmación del backend para crear o editar.
  async function guardarTurno(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!puedeGuardar) return;
    const formulario = new FormData(evento.currentTarget);
    const datos = {
      date: fecha,
      startTime: hora,
      patientName: String(formulario.get("patientName") ?? "").trim(),
      dni: String(formulario.get("dni") ?? ""),
      obraSocial: String(formulario.get("obraSocial") ?? "").trim(),
      phone: String(formulario.get("phone") ?? "").trim() || null,
    };
    if (!datos.patientName || !datos.obraSocial) {
      establecerError("Completá el nombre y la obra social.");
      return;
    }
    establecerGuardando(true);
    establecerError("");

    try {
      await solicitar(turno ? `/api/appointments/${turno.id}` : "/api/appointments", {
        method: turno ? "PATCH" : "POST",
        body: JSON.stringify(datos),
      });
      alGuardar();
    } catch (error) {
      mostrarError(error);
    } finally {
      establecerGuardando(false);
    }
  }

  // Guarda el estado elegido y refresca la agenda después de la confirmación.
  async function cambiarEstado(nuevoEstado: EstadoTurno) {
    if (!turno || guardando || nuevoEstado === estado) return;
    establecerGuardando(true);
    establecerError("");

    try {
      await solicitar(`/api/appointments/${turno.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nuevoEstado }),
      });
      establecerEstado(nuevoEstado);
      alActualizar();
    } catch (error) {
      mostrarError(error);
    } finally {
      establecerGuardando(false);
    }
  }

  // Solicita la cancelación al backend; luego cierra el diálogo y actualiza la agenda.
  async function cancelarTurno() {
    if (!turno || guardando) return;
    establecerGuardando(true);
    establecerError("");

    try {
      await solicitar(`/api/appointments/${turno.id}/cancel`, { method: "POST" });
      alGuardar();
    } catch (error) {
      mostrarError(error);
    } finally {
      establecerGuardando(false);
    }
  }

  return (
    <Dialog
      open
      disablePointerDismissal
      onOpenChange={(abierto, evento) => {
        if (guardando) {
          evento.cancel();
          return;
        }
        if (!abierto) alCerrar();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader className="mb-5 flex-row items-center justify-between gap-0">
          <DialogTitle className="text-xl leading-normal font-semibold">{turno ? "Editar turno" : "Nuevo turno"}</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon" aria-label="Cerrar formulario" disabled={guardando} />}>
            <X />
          </DialogClose>
        </DialogHeader>
        <DialogDescription className="sr-only">Datos y acciones del turno médico.</DialogDescription>

        <form onSubmit={guardarTurno} className="space-y-4">
          <fieldset disabled={guardando} className="grid grid-cols-2 gap-4">
            <Label className="campo grid leading-normal select-auto">
              Fecha
              <Input type="date" required value={fecha} onChange={(evento) => seleccionarFecha(evento.target.value)} />
            </Label>
            <Label className="campo grid leading-normal select-auto">
              Hora
              <NativeSelect
                className="selector"
                required
                value={horaDisponible ? hora : ""}
                disabled={disponibilidad.cargando || !!disponibilidad.error}
                onChange={(evento) => establecerHora(evento.target.value)}
              >
                <NativeSelectOption value="">{disponibilidad.cargando ? "Cargando…" : "Elegí un horario"}</NativeSelectOption>
                {espacios.map((espacio) => (
                  <NativeSelectOption key={espacio.startTime} value={espacio.startTime}>{espacio.startTime}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Label>
            <CamposPaciente turno={turno} />
          </fieldset>
          {disponibilidad.error && (
            <Alert variant="destructive" className="aviso-error block p-3">
              <p>{disponibilidad.error}</p>
              <Button type="button" variant="outline" className="mt-2" disabled={disponibilidad.cargando} onClick={disponibilidad.recargar}>
                Reintentar
              </Button>
            </Alert>
          )}
          {!disponibilidad.cargando && !disponibilidad.error && espacios.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {dia?.blocked ? "La fecha está bloqueada, no hay atención." : "No hay horarios disponibles para esta fecha."}
            </p>
          )}
          {error && <Alert variant="destructive" className="aviso-error block p-3">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" disabled={guardando} />}>Cerrar</DialogClose>
            <Button type="submit" disabled={!puedeGuardar}>
              {guardando ? "Procesando…" : "Guardar turno"}
            </Button>
          </div>
        </form>
        {turno && (
          <fieldset disabled={guardando} className="mt-5 space-y-4 border-t pt-5">
            <Label className="campo grid leading-normal select-auto">
              Estado del turno
              <NativeSelect
                className="selector capitalize"
                value={estado}
                onChange={(evento) => cambiarEstado(evento.target.value as EstadoTurno)}
              >
                <NativeSelectOption value="reservado">Reservado</NativeSelectOption>
                <NativeSelectOption value="atendido">Atendido</NativeSelectOption>
                <NativeSelectOption value="ausente">Ausente</NativeSelectOption>
              </NativeSelect>
            </Label>

            {!confirmando && (
              <Button variant="destructive" onClick={() => establecerConfirmando(true)}>
                Cancelar turno
              </Button>
            )}

            {confirmando && (
              <div className="rounded-lg border border-destructive/25 p-3">
                <p className="mb-3 text-sm">
                  ¿Cancelar el turno de {turno.patientName}? Se eliminará el registro y el horario quedará libre.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={cancelarTurno}>Sí, cancelar turno</Button>
                  <Button variant="outline" onClick={() => establecerConfirmando(false)}>Volver</Button>
                </div>
              </div>
            )}
          </fieldset>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Campos del paciente compartidos por la creación y la edición del turno.
function CamposPaciente({ turno }: PropiedadesPaciente) {
  return (
    <>
      <Label className="campo grid leading-normal select-auto col-span-2">
        Nombre completo
        <Input name="patientName" required defaultValue={turno?.patientName} autoComplete="off" />
      </Label>
      <Label className="campo grid leading-normal select-auto">
        DNI
        <Input
          name="dni"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6,10}"
          title="Entre 6 y 10 dígitos"
          maxLength={10}
          required
          defaultValue={turno?.dni}
        />
      </Label>
      <Label className="campo grid leading-normal select-auto">
        Obra social
        <Input name="obraSocial" required defaultValue={turno?.obraSocial} />
      </Label>
      <Label className="campo grid leading-normal select-auto col-span-2">
        Teléfono (opcional)
        <Input name="phone" type="tel" defaultValue={turno?.phone ?? ""} />
      </Label>
    </>
  );
}
