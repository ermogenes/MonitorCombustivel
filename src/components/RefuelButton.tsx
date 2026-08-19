import { Fuel } from 'lucide-react'

interface RefuelButtonProps {
  enabled: boolean
  onClick: () => void
}

export function RefuelButton({ enabled, onClick }: RefuelButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      className={`group relative w-full overflow-hidden rounded-2xl py-5 text-lg font-bold uppercase tracking-wider transition-all ${
        enabled
          ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-[0.98]'
          : 'cursor-not-allowed bg-slate-800 text-slate-600'
      }`}
    >
      <div className="flex items-center justify-center gap-3">
        <Fuel className="h-6 w-6" />
        Registrar Abastecimento
      </div>
      {enabled && (
        <div className="absolute inset-0 -z-10 animate-pulse bg-gradient-to-r from-orange-600/0 via-orange-400/10 to-orange-600/0" />
      )}
    </button>
  )
}
