// Envía solicitudes JSON, interpreta errores del backend y avisa cuando termina la sesión.

import type { Conflicto } from "@/types/turnos";

export class ErrorApi extends Error {
  // Conserva el estado HTTP, el código y los detalles necesarios para mostrar el error.
  constructor(
    public status: number,
    public code: string,
    message: string,
    public appointments: Conflicto[] = [],
  ) {
    super(message);
  }
}

// Envía JSON con cookies e interpreta los errores y la finalización de la sesión.
export async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response;

  try {
    respuesta = await fetch(ruta, {
      ...opciones,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...opciones.headers },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Volvé a intentar.");
  }

  const datos = await respuesta.json().catch(() => null);
  if (respuesta.ok) return datos as T;

  const sesionFinalizada = respuesta.status === 401 && ruta !== "/api/auth/login";
  if (sesionFinalizada && typeof window !== "undefined") {
    window.location.replace("/login?sesion=expirada");
  }

  let mensaje = "No se pudo completar la solicitud.";
  if (respuesta.status >= 500) mensaje = "El servidor no pudo completar la operación.";
  if (datos?.error?.message) mensaje = datos.error.message;

  throw new ErrorApi(
    respuesta.status,
    datos?.error?.code ?? "HTTP_ERROR",
    mensaje,
    datos?.error?.details?.appointments ?? [],
  );
}

// Obtiene un mensaje legible para mostrar el fallo al usuario.
export function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}
