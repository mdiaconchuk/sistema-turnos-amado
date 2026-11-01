// Envía las credenciales al backend, muestra errores y redirige después del ingreso.

"use client";

import { useState, type SubmitEvent } from "react";
import { Eye, EyeOff, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mensajeError, solicitar } from "@/lib/api";
import type { RespuestaSesion } from "@/types/autenticacion";
import type { PropiedadesLogin } from "@/types/interfaz";

// Muestra el formulario de ingreso y sus mensajes de carga y error.
export function LoginForm({ sesionExpirada = false }: PropiedadesLogin) {
  const [mostrarClave, establecerMostrarClave] = useState(false);
  const [enviando, establecerEnviando] = useState(false);
  const [error, establecerError] = useState("");

  // Envía las credenciales y redirige según el rol que devuelve el backend.
  async function ingresar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const datos = new FormData(evento.currentTarget);
    establecerEnviando(true);
    establecerError("");

    try {
      const { user } = await solicitar<RespuestaSesion>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: datos.get("username"), password: datos.get("password") }),
      });
      window.location.replace(user.role === "facturista" ? "/dashboard/reportes" : "/dashboard/agenda");
    } catch (error) {
      establecerError(mensajeError(error));
    } finally {
      establecerEnviando(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight">Bienvenido</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ingresá tus credenciales para continuar.</p>
      </div>

      <form onSubmit={ingresar} onChange={() => establecerError("")} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Ingresá tu usuario"
            autoComplete="username"
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={mostrarClave ? "text" : "password"}
              placeholder="Ingresá tu contraseña"
              autoComplete="current-password"
              required
              className="h-11 pr-11"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => establecerMostrarClave((anterior) => !anterior)}
              aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={mostrarClave}
              className="absolute inset-y-0 right-0 h-full w-11 rounded-none border-0 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              {mostrarClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        {sesionExpirada && (
          <p role="status" className="text-sm text-muted-foreground">
            Tu sesión finalizó o no está disponible. Volvé a iniciar sesión.
          </p>
        )}
        {error && (
          <Alert variant="destructive" role="alert" className="border-destructive/20 bg-destructive/10">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </div>
  );
}
