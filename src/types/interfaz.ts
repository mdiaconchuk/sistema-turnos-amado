// Define las propiedades de los componentes y el estado de las consultas del frontend.

import type { ComponentProps } from "react";
import type { Dia, Espacio, Turno } from "@/types/turnos";

export type VistaAgenda = "dia" | "semana";
export type SeleccionTurno = { fecha: string; hora: string; turno?: Turno };

export type PropiedadesAgendaDiaria = {
  dia: Dia;
  deshabilitada: boolean;
  alSeleccionar: (dia: Dia, espacio: Espacio) => void;
};

export type PropiedadesAgendaSemanal = {
  dias: Dia[];
  deshabilitada: boolean;
  alSeleccionar: (dia: Dia, espacio: Espacio) => void;
};

export type PropiedadesFormularioTurno = {
  turno?: Turno;
  fechaInicial: string;
  horaInicial: string;
  alCerrar: () => void;
  alActualizar: () => void;
  alGuardar: () => void;
};

export type PropiedadesPaciente = { turno?: Turno };
export type PropiedadesLogin = { sesionExpirada?: boolean };

export type PropiedadesErrorConfiguracion = {
  error: Error | null;
  mensaje?: string;
  alReintentar?: () => void;
};

export type ResultadoConsulta<T> = {
  ruta: string;
  datos: T | null;
  cargando: boolean;
  error: string;
};

// Conserva las propiedades nativas del select que utiliza shadcn.
export type PropiedadesNativeSelect = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
};
