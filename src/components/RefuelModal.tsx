import { useState, useEffect } from 'react'
import {
  X,
  MapPin,
  Fuel,
  Gauge,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import type { TelemetryData, GeoLocation } from '../types'

interface RefuelModalProps {
  telemetry: TelemetryData
  odometerManual: number | null
  onConfirm: (manualOdometer: number | null, geo: GeoLocation | null) => Promise<void>
  onClose: () => void
}

export function RefuelModal({
  telemetry,
  odometerManual,
  onConfirm,
  onClose,
}: RefuelModalProps) {
  const [odometer, setOdometer] = useState<string>(
    odometerManual !== null
      ? String(odometerManual)
      : telemetry.odometerKm !== null
        ? String(telemetry.odometerKm)
        : ''
  )
  const [geo, setGeo] = useState<GeoLocation | null>(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [geoError, setGeoError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoLoading(false)
      setGeoError(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        })
        setGeoLoading(false)
      },
      () => {
        setGeoError(true)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const odo = odometer ? parseFloat(odometer) : null
      await onConfirm(odo, geo)
      onClose()
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-bold text-white">Confirmar Abastecimento</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
            <Gauge className="h-5 w-5 text-orange-400" />
            <div className="flex-1">
              <label className="text-xs text-slate-500">Odômetro (km)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="Ex: 48520"
                className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
            <Fuel className="h-5 w-5 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-500">Tanque</div>
              <div className="text-lg font-bold text-white">
                {telemetry.fuelLevel !== null ? `${telemetry.fuelLevel}%` : '--'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
            <Battery className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-xs text-slate-500">Bateria</div>
              <div className="text-lg font-bold text-white">
                {telemetry.batteryVoltage !== null
                  ? `${telemetry.batteryVoltage}V`
                  : '--'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
            <MapPin className="h-5 w-5 text-purple-400" />
            <div>
              <div className="text-xs text-slate-500">GPS</div>
              <div className="text-sm text-white">
                {geoLoading ? (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Obtendo localização...
                  </span>
                ) : geoError ? (
                  <span className="text-slate-500">Indisponível</span>
                ) : (
                  `${geo!.latitude.toFixed(4)}, ${geo!.longitude.toFixed(4)}`
                )}
              </div>
            </div>
          </div>

          {telemetry.dtcCodes.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <div className="text-xs text-red-400">DTCs Ativos</div>
                <div className="text-sm text-red-300">
                  {telemetry.dtcCodes.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 px-5 py-4">
          <button
            onClick={handleConfirm}
            disabled={submitting || !odometer}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            Confirmar Registro
          </button>
        </div>
      </div>
    </div>
  )
}
