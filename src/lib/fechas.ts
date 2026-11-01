// Obtiene la fecha de Argentina y permite sumar días y mostrar fechas en la interfaz.

export function hoyArgentina(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}
// Suma o resta días a una fecha sin desplazarla por la zona horaria.
export function sumarDias(fecha: string, cantidad: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + cantidad)).toISOString().slice(0, 10);
}
// Formatea el día y el mes; permite mostrar el nombre completo del día.
export function mostrarFecha(fecha: string, completa = false): string {
  if (completa) {
    const dia = new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long" });
    return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fecha.slice(8, 10)}-${fecha.slice(5, 7)}`;
  }
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}
