import { useState, useEffect, useCallback } from 'react'
import {
  Gauge,
  Fuel,
  Battery,
  Activity,
  Pencil,
  AlertTriangle,
  Clock,
  History,
  WifiOff,
  Info,
} from 'lucide-react'

import { Header } from './components/Header'
import { TelemetryCard, FuelBar } from './components/TelemetryCard'
import { RefuelButton } from './components/RefuelButton'
import { RefuelModal } from './components/RefuelModal'
import { HistoryList } from './components/HistoryList'
import { SettingsModal } from './components/SettingsModal'

import { useOBD } from './hooks/useOBD'
import { useGoogleDrive } from './hooks/useGoogleDrive'
import { useHistory } from './hooks/useHistory'
import { setupAutoSync } from './services/syncQueue'

export default function App() {
  const obd = useOBD()
  const drive = useGoogleDrive()
  const history = useHistory()

  const [showSettings, setShowSettings] = useState(false)
  const [showRefuel, setShowRefuel] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualOdometer, setManualOdometer] = useState<number | null>(() => {
    const raw = localStorage.getItem('app_settings')
    if (raw) {
      const s = JSON.parse(raw)
      return s.odometerManual ?? null
    }
    return null
  })
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    setupAutoSync()
  }, [])

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(t)
    }
  }, [notification])

  const isBtReady =
    obd.connectionState === 'ready' || obd.connectionState === 'reading'
  const isBtSupported = obd.supported

  const handleRefuelConfirm = useCallback(
    async (odo: number | null, geo: any) => {
      const odoValue = odo ?? manualOdometer
      await history.registerRefuel(obd.telemetry, odoValue, geo)
      setNotification('Abastecimento registrado com sucesso!')
      if (!navigator.onLine) {
        setNotification('Salvo localmente. Sincronizará quando houver internet.')
      } else if (!drive.signedIn) {
        setNotification('Salvo localmente. Faça login no Drive para sincronizar.')
      }
    },
    [obd.telemetry, manualOdometer, history, drive.signedIn]
  )

  const handleManualOdometerSave = useCallback(() => {
    const val = localStorage.getItem('app_settings')
    const s = val ? JSON.parse(val) : {}
    s.odometerManual = manualOdometer
    localStorage.setItem('app_settings', JSON.stringify(s))
    setShowManualInput(false)
    setNotification('Odômetro manual atualizado')
  }, [manualOdometer])

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        connectionState={obd.connectionState}
        gDriveSignedIn={drive.signedIn}
        gDriveLoading={drive.loading}
        pendingCount={history.pendingCount}
        onConnect={obd.connect}
        onDisconnect={obd.disconnect}
        onGoogleLogin={drive.login}
        onGoogleLogout={drive.logout}
        onSettings={() => setShowSettings(true)}
        onSync={history.syncAll}
      />

      {/* Notification */}
      {notification && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white shadow-xl">
          {notification}
        </div>
      )}

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {/* No Bluetooth support warning */}
        {!isBtSupported && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
            <div className="text-sm">
              <p className="font-medium text-amber-300">
                Web Bluetooth não suportado
              </p>
              <p className="mt-1 text-amber-400/80">
                Use Chrome/Edge no Android ou desktop. Você pode inserir dados
                manualmente.
              </p>
            </div>
          </div>
        )}

        {/* Offline warning */}
        {!navigator.onLine && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-400">
            <WifiOff className="h-4 w-4" />
            Modo offline - dados serão sincronizados depois
          </div>
        )}

        {/* Manual odometer */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Pencil className="h-4 w-4" />
            Odômetro manual:
          </div>
          {showManualInput ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={manualOdometer ?? ''}
                onChange={(e) =>
                  setManualOdometer(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="km"
                className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-right text-sm text-white focus:border-orange-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleManualOdometerSave}
                className="rounded-lg bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowManualInput(true)}
              className="text-sm font-medium text-orange-400 hover:text-orange-300"
            >
              {manualOdometer !== null
                ? `${manualOdometer.toLocaleString('pt-BR')} km`
                : 'Definir'}
            </button>
          )}
        </div>

        {/* Telemetry Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <TelemetryCard
              label="Odômetro"
              value={
                obd.telemetry.odometerKm !== null
                  ? obd.telemetry.odometerKm.toLocaleString('pt-BR')
                  : manualOdometer !== null
                    ? manualOdometer.toLocaleString('pt-BR')
                    : null
              }
              unit="km"
              icon={<Gauge className="h-4 w-4" />}
            />
          </div>

          <div className="col-span-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Fuel className="h-4 w-4 text-emerald-400" />
                Nível do Tanque
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-emerald-400">
                  {obd.telemetry.fuelLevel !== null ? obd.telemetry.fuelLevel : '--'}
                </span>
                <span className="text-xs text-slate-500">%</span>
              </div>
              <FuelBar level={obd.telemetry.fuelLevel} />
            </div>
          </div>

          <TelemetryCard
            label="Bateria"
            value={obd.telemetry.batteryVoltage}
            unit="V"
            icon={<Battery className="h-4 w-4" />}
            color="text-blue-400"
          />

          <TelemetryCard
            label="RPM"
            value={obd.telemetry.rpm}
            unit="rpm"
            icon={<Activity className="h-4 w-4" />}
            color="text-purple-400"
          />

          <div className="col-span-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <AlertTriangle
                className={`h-5 w-5 ${obd.telemetry.dtcCodes.length > 0 ? 'text-red-400' : 'text-slate-600'}`}
              />
              <div>
                <div className="text-xs text-slate-500">DTCs</div>
                <div
                  className={`text-sm font-medium ${obd.telemetry.dtcCodes.length > 0 ? 'text-red-400' : 'text-slate-600'}`}
                >
                  {obd.telemetry.dtcCodes.length > 0
                    ? obd.telemetry.dtcCodes.join(', ')
                    : 'Nenhum código'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Button */}
        <RefuelButton
          enabled={isBtSupported}
          onClick={() => setShowRefuel(true)}
        />

        {/* History */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-400">
              Histórico Recente
            </h3>
          </div>
          <HistoryList items={history.items} />
        </section>

        {/* OBD Logs */}
        {obd.logs.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-medium text-slate-400">
                  Log OBD-II
                </h3>
              </div>
              <button
                onClick={obd.clearLogs}
                className="text-xs text-slate-600 hover:text-slate-400"
              >
                Limpar
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto rounded-xl bg-black p-3 font-mono text-xs">
              {obd.logs.slice(-20).map((line, i) => (
                <div key={i} className="text-slate-500">
                  {line}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer spacer */}
        <div className="h-8" />
      </main>

      {/* Modals */}
      {showRefuel && (
        <RefuelModal
          telemetry={obd.telemetry}
          odometerManual={manualOdometer}
          onConfirm={handleRefuelConfirm}
          onClose={() => setShowRefuel(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSendRaw={isBtReady ? obd.sendRaw : undefined}
        />
      )}
    </div>
  )
}
