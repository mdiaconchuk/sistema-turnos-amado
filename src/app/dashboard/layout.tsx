// Comprueba la sesión y muestra la navegación y el contenido permitido para el usuario.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { mensajeError, solicitar } from "@/lib/api";
import type { Usuario, RespuestaSesion } from "@/types/autenticacion";

const secciones = [
  { ruta: "/dashboard/agenda", nombre: "Agenda", Icono: CalendarDays },
  { ruta: "/dashboard/reportes", nombre: "Reportes", Icono: ClipboardList },
  { ruta: "/dashboard/configuracion", nombre: "Configuración", Icono: Settings },
];

// Comprueba la sesión y muestra la navegación y el contenido permitido para su rol.
export default function MarcoDashboard({ children }: LayoutProps<"/dashboard">) {
  const [usuario, establecerUsuario] = useState<Usuario | null>(null);
  const [error, establecerError] = useState("");
  const [cerrandoSesion, establecerCerrandoSesion] = useState(false);
  const ruta = usePathname();
  const router = useRouter();

  // Vuelve a verificar la sesión al navegar y cancela la consulta anterior.
  useEffect(() => {
    const controlador = new AbortController();

    // Consulta el usuario actual y redirige si su rol no permite acceder a la ruta.
    async function comprobarSesion() {
      try {
        const { user } = await solicitar<RespuestaSesion>("/api/auth/me", { signal: controlador.signal });
        if (controlador.signal.aborted) return;
        establecerUsuario(user);
        establecerError("");
        const esFacturista = user.role === "facturista";
        if (ruta === "/dashboard" || (esFacturista && ruta !== "/dashboard/reportes")) {
          router.replace(esFacturista ? "/dashboard/reportes" : "/dashboard/agenda");
        }
      } catch (error) {
        if (controlador.signal.aborted) return;
        establecerUsuario(null);
        establecerError(mensajeError(error));
      }
    }

    void comprobarSesion();
    return () => controlador.abort();
  }, [ruta, router]);

  // Cierra la sesión en el backend antes de volver al login.
  async function cerrarSesion() {
    if (cerrandoSesion) return;
    establecerCerrandoSesion(true);
    establecerError("");
    try {
      await solicitar("/api/auth/logout", { method: "POST" });
      window.location.replace("/login");
    } catch (error) {
      establecerError(mensajeError(error));
    } finally {
      establecerCerrandoSesion(false);
    }
  }

  if (!usuario) {
    return (
      <main className="m-auto space-y-4 p-10" aria-live="polite">
        {!error && <p>Verificando sesión…</p>}
        {error && (
          <>
            <p role="alert">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
            <Link className="ml-4 underline" href="/login">Ir al login</Link>
          </>
        )}
      </main>
    );
  }

  const esSecretaria = usuario.role === "secretaria";
  const enlaces = secciones.filter((seccion) => esSecretaria || seccion.ruta === "/dashboard/reportes");
  const rutaPermitida = esSecretaria || ruta === "/dashboard/reportes";

  return (
    <div className="flex min-h-screen">
      {/* SIDEBAR */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground">
        <div className="mb-10 flex items-center gap-3">
          <Image src="/logo.png" alt="" width={38} height={38} className="rounded-full bg-white p-1" />
          <div className="font-semibold">
            Consultorio
            <div className="text-sm font-normal opacity-80">Dr. Amado</div>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="space-y-2">
          {enlaces.map(({ ruta: destino, nombre, Icono }) => (
            <Link
              key={destino}
              href={destino}
              aria-current={ruta === destino ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${ruta === destino ? "bg-sidebar-accent" : "hover:bg-white/10"}`}
            >
              <Icono className="size-4.5" />
              {nombre}
            </Link>
          ))}
        </nav>
        <Button
          type="button"
          variant="ghost"
          disabled={cerrandoSesion}
          onClick={cerrarSesion}
          className="mt-auto h-auto justify-start gap-3 rounded-lg border-0 p-3 text-sm font-normal text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground disabled:opacity-50"
        >
          <LogOut className="size-5" />
          {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
        </Button>
      </aside>

      {/* BARRA SUPERIOR LAYOUT */}
      <div className="min-w-0 flex-1">
        <header className="flex h-18 items-center justify-between border-b bg-card px-8">
          <Badge variant="secondary" className="h-auto rounded-lg border-0 px-4 py-1 text-sm font-normal capitalize">{usuario.role}</Badge>
        </header>
        <main className="mx-auto max-w-375 space-y-5 p-8">
          {error && <Alert variant="destructive" className="aviso-error block p-3">{error}</Alert>}
          {rutaPermitida && children}
          {!rutaPermitida && <p>Redirigiendo a Reportes…</p>}
        </main>
      </div>
    </div>
  );
}
