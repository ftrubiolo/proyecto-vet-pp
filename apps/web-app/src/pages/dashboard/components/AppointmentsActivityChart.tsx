import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { CalendarDays } from 'lucide-react';
import { getUIEstado } from '@vetvault/shared';

interface CitaRecord {
  fecha_hora: string;
  estado_cita?: { estado?: string };
  estado?: string;
  [key: string]: unknown;
}

interface AppointmentsActivityChartProps {
  citas: CitaRecord[];
}

export function AppointmentsActivityChart({ citas = [] }: AppointmentsActivityChartProps) {
  const chartData = useMemo(() => {
    // Group citas by day of current week or recent 7 days
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const countsByDay: Record<string, { total: number; completadas: number }> = {};

    // Initialize last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayKey = `${d.getDate()}/${d.getMonth() + 1}`;
      countsByDay[dayKey] = { total: 0, completadas: 0 };
    }

    (citas || []).forEach((c) => {
      const d = new Date(c.fecha_hora);
      const dayKey = `${d.getDate()}/${d.getMonth() + 1}`;
      if (countsByDay[dayKey] !== undefined) {
        countsByDay[dayKey].total += 1;
        const estado = getUIEstado(c);
        if (estado === 'Completada') {
          countsByDay[dayKey].completadas += 1;
        }
      }
    });

    return Object.entries(countsByDay).map(([key, data]) => {
      const [day, month] = key.split('/');
      const dateObj = new Date(today.getFullYear(), Number(month) - 1, Number(day));
      return {
        key,
        dayLabel: `${dayNames[dateObj.getDay()]} ${day}`,
        total: data.total,
        completadas: data.completadas,
      };
    });
  }, [citas]);

  const totalWeekly = chartData.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-[var(--accent)]" />
          <h4 className="text-sm font-semibold text-[var(--text-h)]">
            Citas últimos 7 días
          </h4>
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)]">
          Total: <strong className="text-[var(--text-h)]">{totalWeekly}</strong>
        </span>
      </div>

      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-[var(--border)]"
            />
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-[var(--text-muted)]"
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-[var(--text-muted)]"
            />
            <Tooltip
              content={({ active, payload }: { active?: boolean; payload?: Array<{ payload: { dayLabel: string; total: number; completadas: number } }> }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)]/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-[var(--text-h)]">
                      {data.dayLabel}
                    </p>
                    <p className="text-[var(--accent)]">
                      Total citas: <strong>{data.total}</strong>
                    </p>
                    <p className="text-[var(--success)]">
                      Completadas: <strong>{data.completadas}</strong>
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="total"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.total > 0 ? 'var(--accent, #0ea5e9)' : 'var(--border)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
