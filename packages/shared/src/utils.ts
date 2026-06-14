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

export function getEstadoBadgeVariant(estado: string) {
  switch (estado) {
    case 'Confirmada': return 'success' as const;
    case 'Pendiente': return 'warning' as const;
    case 'Cancelada': return 'danger' as const;
    case 'Completada': return 'neutral' as const;
    default: return 'neutral' as const;
  }
}

export function getUIEstado(c: any): string {
  if (c.atenciones && c.atenciones.length > 0) return 'Completada';
  const estado = c.estado_cita?.estado;
  if (estado === 'Agendada') return 'Pendiente';
  return estado || 'Pendiente';
}

export const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
