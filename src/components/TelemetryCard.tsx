import type { ReactNode } from 'react'

interface TelemetryCardProps {
  label: string
  value: string | number | null
  unit: string
  icon: ReactNode
  color?: string
  onClick?: () => void
}

export function TelemetryCard({
  label,
  value,
  unit,
  icon,
  color = 'text-orange-400',
  onClick,
}: TelemetryCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700 hover:bg-slate-800/80 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold tabular-nums ${color}`}>
          {value !== null ? value : '--'}
        </span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </button>
  )
}

interface FuelBarProps {
  level: number | null
}

export function FuelBar({ level }: FuelBarProps) {
  const pct = level ?? 0
  const color =
    pct > 50
      ? 'bg-emerald-500'
      : pct > 25
        ? 'bg-amber-500'
        : 'bg-red-500'

  return (
    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
