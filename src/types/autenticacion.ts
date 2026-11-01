// Define los datos del usuario que devuelve el backend.

export type Usuario = {
  id: string;
  role: "secretaria" | "facturista";
};

export type RespuestaSesion = { user: Usuario };
