import { CheckCircle2, Clock, AlertCircle, Fuel, Gauge } from 'lucide-react'
import type { SyncQueueItem } from '../types'

interface HistoryListProps {
  items: SyncQueueItem[]
}

const statusConfig = {
  synced: {
    icon: CheckCircle2,
    label: 'Sincronizado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  pending: {
    icon: Clock,
    label: 'Pendente',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  error: {
    icon: AlertCircle,
    label: 'Erro',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
}

export function HistoryList({ items }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <Fuel className="mx-auto mb-3 h-8 w-8 text-slate-600" />
        <p className="text-sm text-slate-500">Nenhum abastecimento registrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const st = statusConfig[item.status]
        const StatusIcon = st.icon
        const date = new Date(item.event.timestamp)

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition hover:border-slate-700"
          >
            <div className={`rounded-lg p-2 ${st.bg}`}>
              <StatusIcon className={`h-4 w-4 ${st.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {date.toLocaleDateString('pt-BR')}
                </span>
                <span className="text-xs text-slate-500">
                  {date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {item.event.odometro_km.toLocaleString('pt-BR')} km
                </span>
                <span className="flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  {item.event.tanque_combustivel_pct}%
                </span>
              </div>
            </div>

            <div className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.bg} ${st.color}`}>
              {st.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
