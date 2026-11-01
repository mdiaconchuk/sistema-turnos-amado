import { timeToMinutes, weekdayOf } from "@/lib/validation";

export type Range = {
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

// Un turno encaja si cae exactamente en un espacio derivado de alguno de los rangos del día
export function slotFitsRanges(date: string, startTime: string, ranges: Range[]): boolean {
  const t = timeToMinutes(startTime);
  const weekday = weekdayOf(date);
  return ranges.some((r) => {
    if (r.weekday !== weekday) return false;
    const start = timeToMinutes(r.startTime);
    const end = timeToMinutes(r.endTime);
    return t >= start && t + r.slotMinutes <= end && (t - start) % r.slotMinutes === 0;
  });
}

// Fecha de hoy en el consultorio (Argentina), formato YYYY-MM-DD
export function todayInArgentina(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}