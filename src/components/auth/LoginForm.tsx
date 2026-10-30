"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Eye, EyeOff, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    // Simulación temporal de credenciales incorrectas.
    // Más adelante se conectará con Supabase Auth.
    setLoginError(true);
  }

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight">Bienvenido</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Ingresá tus credenciales para continuar.
        </p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        onChange={() => setLoginError(false)}
        className="space-y-5"
      >
        {/* Usuario */}
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

        {/* Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ingresá tu contraseña"
              autoComplete="current-password"
              required
              className="h-11 pr-11"
            />

            {/* Mostrar / ocultar contraseña */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Error de autenticación */}
        {loginError && (
          <Alert
            variant="destructive"
            role="alert"
            className="border-destructive/20 bg-destructive/10"
          >
            <CircleAlert aria-hidden="true" />
            <AlertDescription>
              Usuario o contraseña incorrectos.
            </AlertDescription>
          </Alert>
        )}

        {/* Botón de ingreso */}
        <Button type="submit" size="lg" className="w-full">
          Ingresar
        </Button>
      </form>
    </div>
  );
}
