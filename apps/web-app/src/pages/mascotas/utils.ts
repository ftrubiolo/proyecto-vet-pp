export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function calcAge(dateStr: string): string {
  const birth = new Date(dateStr);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${Math.max(totalMonths, 0)} meses`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} año${y > 1 ? 's' : ''} y ${m} mes${m > 1 ? 'es' : ''}` : `${y} año${y > 1 ? 's' : ''}`;
}
