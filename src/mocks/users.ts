export type UserRole = "secretaria" | "facturista";

export interface MockUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export const mockUsers: MockUser[] = [
  {
    id: "1",
    username: "secretaria",
    name: "Secretaria",
    role: "secretaria",
  },
  {
    id: "2",
    username: "facturista",
    name: "Facturista",
    role: "facturista",
  },
];