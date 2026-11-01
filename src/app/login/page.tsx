// Muestra la pantalla de ingreso y el aviso de sesión finalizada.


import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = {
  title: "Iniciar sesión | Consultorio Dr. Amado",
};

// Muestra el login e informa si la sesión anterior terminó.
export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { sesion } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-xl md:grid-cols-2">

        {/* Panel izquierdo */}
        <section className="relative flex min-h-80 flex-col justify-between overflow-hidden bg-primary p-8 text-white md:min-h-[560px] md:p-10">

          <Image
            src="/consultorio.jpg"
            alt="Interior del consultorio médico"
            fill
            className="object-cover"
          />

          {/* Capa de color */}
          <div className="absolute inset-0 bg-linear-to-t from-[#00576D]/95 via-[#007C99]/65 to-[#0090B0]/35" />

          {/* Identidad del consultorio */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-full bg-white p-1.5">
              <Image
                src="/logo.png"
                alt="Logo del consultorio"
                width={32}
                height={32}
              />
            </div>

            <span className="text-lg font-semibold">
              Consultorio Dr. Amado
            </span>
          </div>

          {/* Mensaje inferior */}
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Una agenda más simple.
            </h1>

            <p className="mt-4 max-w-sm text-base text-white/85">
              Gestioná los turnos y consultá la información
              del consultorio desde un solo lugar.
            </p>
          </div>

          <p className="relative z-10 text-sm text-white/70">
            Sistema de gestión de turnos
          </p>
        </section>

        {/* Panel derecho: formulario */}
        <section className="flex items-center justify-center bg-card p-8 md:p-12">
          <div className="w-full max-w-sm">
            <LoginForm sesionExpirada={sesion === "expirada"} />
          </div>
        </section>

      </div>
    </main>
  )
}
