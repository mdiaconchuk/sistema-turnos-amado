export function parseId(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

// Transiciones permitidas entre estados (cancelar va por su propio endpoint y es final)
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  reservado: ["atendido", "ausente"],
  atendido: ["ausente", "reservado"],
  ausente: ["atendido", "reservado"],
  cancelado: [],
};