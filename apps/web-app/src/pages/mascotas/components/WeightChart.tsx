import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeightChartProps {
  atenciones: any[];
}

export function WeightChart({ atenciones }: WeightChartProps) {
  // Extract and sort weight records
  const points = (atenciones || [])
    .filter((a) => a.peso_actual && !isNaN(Number(a.peso_actual)))
    .map((a) => {
      const date = new Date(a.fecha_atencion);
      return {
        date,
        rawDate: a.fecha_atencion,
        dateStr: date.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
        }),
        fullDate: date.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        weight: Number(Number(a.peso_actual).toFixed(2)),
        diagnostico: a.diagnostico || 'Control de peso',
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
          <Scale size={24} />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          No hay registros de peso para esta mascota.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Los pesos registrados en cada consulta clínica aparecerán aquí de forma evolutiva.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const weights = points.map((p) => p.weight);
  const currentWeight = weights[weights.length - 1];
  const initialWeight = weights[0];
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const diff = Number((currentWeight - initialWeight).toFixed(2));

  // Determine Y Domain with breathing room
  const yDomainMin = Math.max(0, Math.floor(minWeight - (maxWeight === minWeight ? 1 : (maxWeight - minWeight) * 0.15)));
  const yDomainMax = Math.ceil(maxWeight + (maxWeight === minWeight ? 1 : (maxWeight - minWeight) * 0.15));

  return (
    <div className="w-full space-y-4">
      {/* Stat indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Actual
          </span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {currentWeight} <span className="text-xs font-normal text-slate-500">kg</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Mínimo
          </span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {minWeight} <span className="text-xs font-normal text-slate-500">kg</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Máximo
          </span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {maxWeight} <span className="text-xs font-normal text-slate-500">kg</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Variación
          </span>
          <div className="flex items-center gap-1.5">
            {diff > 0 ? (
              <>
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  +{diff} <span className="text-xs font-normal">kg</span>
                </span>
              </>
            ) : diff < 0 ? (
              <>
                <TrendingDown size={16} className="text-amber-500" />
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {diff} <span className="text-xs font-normal">kg</span>
                </span>
              </>
            ) : (
              <>
                <Minus size={16} className="text-slate-400" />
                <span className="text-lg font-bold text-slate-600 dark:text-slate-300">
                  0 <span className="text-xs font-normal">kg</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent, #0ea5e9)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--accent, #0ea5e9)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
            />
            <XAxis
              dataKey="dateStr"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-slate-500 dark:text-slate-400"
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-slate-500 dark:text-slate-400"
              unit=" kg"
            />
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1 z-50">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-4">
                      <span>{data.fullDate}</span>
                      <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                        {data.weight} kg
                      </span>
                    </div>
                    {data.diagnostico && (
                      <p className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {data.diagnostico}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="var(--accent, #0ea5e9)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#weightAreaGrad)"
              activeDot={{
                r: 6,
                fill: 'var(--accent, #0ea5e9)',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              dot={{
                r: 4,
                fill: 'var(--accent, #0ea5e9)',
                stroke: '#ffffff',
                strokeWidth: 1.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
