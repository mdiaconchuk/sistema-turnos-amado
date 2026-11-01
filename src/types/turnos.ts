// Define los datos compartidos que devuelve la API del consultorio.

export type EstadoTurno = "reservado" | "atendido" | "ausente";

export type Turno = {
  id: number;
  date: string;
  startTime: string;
  patientName: string;
  dni: string;
  obraSocial: string;
  phone: string | null;
  status: EstadoTurno;
};

// Los cancelados no aparecen como espacios ocupados en la agenda.
export type Espacio = {
  startTime: string;
  status: "libre" | EstadoTurno;
  appointment?: Pick<Turno, "id" | "patientName" | "dni" | "obraSocial" | "phone">;
};

export type Dia = { date: string; blocked: boolean; slots: Espacio[] };

export type Rango = {
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

export type Bloqueo = { date: string; reason: string | null };
export type Conflicto = Pick<Turno, "id" | "date" | "startTime" | "patientName" | "status">;

export type Atendido = Pick<Turno, "date" | "startTime" | "patientName" | "dni" | "obraSocial">;

export type RespuestaDisponibilidad = { days: Dia[] };
export type RespuestaHorarios = { ranges: Rango[] };
export type RespuestaBloqueos = { dates: Bloqueo[] };
export type RespuestaReporte = { items: Atendido[] };
