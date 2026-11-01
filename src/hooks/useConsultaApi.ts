// Maneja consultas, carga, errores, recarga y actualización periódica opcional de la API.

"use client";

import { useEffect, useState } from "react";
import { mensajeError, solicitar } from "@/lib/api";

import type { ResultadoConsulta } from "@/types/interfaz";

// Comparte la carga, la recarga y la actualización periódica opcional de una consulta.
export function useConsultaApi<T>(ruta: string, actualizarCada = 0) {
  const [resultado, establecerResultado] = useState<ResultadoConsulta<T>>({ ruta, datos: null, cargando: true, error: "" });
  const [recarga, establecerRecarga] = useState(0);

  // Mantiene la consulta al día y cancela las solicitudes anteriores al cambiar de pantalla.
  useEffect(() => {
    const controlador = new AbortController();
    let pendiente = false;

    // Solicita datos sin superponer pedidos y descarta las respuestas canceladas.
    async function consultar() {
      if (pendiente) return;
      pendiente = true;

      try {
        const datos = await solicitar<T>(ruta, { signal: controlador.signal });
        if (!controlador.signal.aborted) establecerResultado({ ruta, datos, cargando: false, error: "" });
      } catch (error) {
        if (controlador.signal.aborted) return;
        establecerResultado((anterior) => ({
          ruta,
          datos: anterior.ruta === ruta ? anterior.datos : null,
          cargando: false,
          error: mensajeError(error),
        }));
      } finally {
        pendiente = false;
      }
    }

    // Refresca los datos únicamente mientras la pestaña está visible.
    function actualizarSiVisible() {
      if (document.visibilityState === "visible") void consultar();
    }

    void consultar();
    let intervalo: number | undefined;
    if (actualizarCada > 0) {
      intervalo = window.setInterval(actualizarSiVisible, actualizarCada);
      window.addEventListener("focus", actualizarSiVisible);
    }

    return () => {
      controlador.abort();
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizarSiVisible);
    };
  }, [ruta, actualizarCada, recarga]);

  // Activa la carga y vuelve a consultar la misma URL.
  function recargar() {
    establecerResultado((anterior) => ({ ...anterior, cargando: true, error: "" }));
    establecerRecarga((anterior) => anterior + 1);
  }

  // Conserva una edición local o una respuesta que el backend ya confirmó.
  function actualizarDatos(datos: T) {
    establecerResultado({ ruta, datos, cargando: false, error: "" });
  }

  // Al cambiar la URL no se muestran los datos del período anterior.
  const datos = resultado.ruta === ruta ? resultado.datos : null;
  const error = resultado.ruta === ruta ? resultado.error : "";

  const cargando = resultado.ruta !== ruta || resultado.cargando;
  return { datos, error, cargando, recargar, actualizarDatos };
}
