import {
  Bluetooth,
  BluetoothConnected,
  Cloud,
  CloudOff,
  Settings,
  RotateCw,
} from 'lucide-react'
import type { ConnectionState } from '../types'

interface HeaderProps {
  connectionState: ConnectionState
  gDriveSignedIn: boolean
  gDriveLoading: boolean
  pendingCount: number
  onConnect: () => void
  onDisconnect: () => void
  onGoogleLogin: () => void
  onGoogleLogout: () => void
  onSettings: () => void
  onSync: () => void
}

export function Header({
  connectionState,
  gDriveSignedIn,
  gDriveLoading,
  pendingCount,
  onConnect,
  onDisconnect,
  onGoogleLogin,
  onGoogleLogout,
  onSettings,
  onSync,
}: HeaderProps) {
  const btConnected = connectionState === 'ready' || connectionState === 'reading'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-orange-400">⛽ OBD2</span>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={onSync}
              className="relative flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-amber-400 transition hover:bg-slate-700"
              title={`${pendingCount} pendente(s)`}
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>{pendingCount}</span>
            </button>
          )}

          <button
            onClick={btConnected ? onDisconnect : onConnect}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              btConnected
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : connectionState === 'connecting'
                  ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            {btConnected ? (
              <BluetoothConnected className="h-4 w-4" />
            ) : (
              <Bluetooth className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {connectionState === 'disconnected'
                ? 'Conectar'
                : connectionState === 'connecting'
                  ? 'Conectando...'
                  : connectionState === 'ready'
                    ? 'Pronto'
                    : 'Lendo'}
            </span>
          </button>

          <button
            onClick={gDriveSignedIn ? onGoogleLogout : onGoogleLogin}
            disabled={gDriveLoading}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              gDriveSignedIn
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            } ${gDriveLoading ? 'opacity-50' : ''}`}
          >
            {gDriveSignedIn ? (
              <Cloud className="h-4 w-4" />
            ) : (
              <CloudOff className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Drive</span>
          </button>

          <button
            onClick={onSettings}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-300"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
