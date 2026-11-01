// Redirige la entrada de la aplicación hacia el dashboard.

import { redirect } from "next/navigation";
// Redirige la entrada de la aplicación al dashboard.
export default function Inicio() {
  redirect("/dashboard");
}
