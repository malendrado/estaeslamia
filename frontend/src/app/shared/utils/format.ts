/** Fecha + hora en formato chileno, para mostrar en detalles de admin. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Rango de presupuesto formateado, o cadena vacía si no hay ninguno de los dos valores. */
export function formatBudgetRange(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return '';
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  return fmt(min ?? max!);
}
