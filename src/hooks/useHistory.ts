import { useState, useEffect, useCallback } from 'react'
import { getRecentEvents, addRefuelEvent, getAllItems, updateItemStatus } from '../db/database'
import { googleDriveService } from '../services/googleDrive'
import { syncPendingItems } from '../services/syncQueue'
import type { SyncQueueItem, RefuelEvent, GeoLocation, TelemetryData } from '../types'

export function useHistory() {
  const [items, setItems] = useState<SyncQueueItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(async () => {
    const all = await getRecentEvents(50)
    setItems(all)
    const pending = all.filter((i) => i.status === 'pending')
    setPendingCount(pending.length)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const registerRefuel = useCallback(
    async (
      telemetry: TelemetryData,
      manualOdometer: number | null,
      geo: GeoLocation | null
    ): Promise<SyncQueueItem> => {
      const odometer = manualOdometer ?? telemetry.odometerKm ?? 0

      const event: Omit<RefuelEvent, 'id'> = {
        tipo_evento: 'ABASTECIMENTO',
        versao_schema: '1.0',
        timestamp: new Date().toISOString(),
        odometro_km: odometer,
        tanque_combustivel_pct: telemetry.fuelLevel ?? 0,
        bateria_v: telemetry.batteryVoltage ?? 0,
        geolocalizacao: geo,
        diagnosticos_dtc: telemetry.dtcCodes ?? [],
        origem: 'PWA_OBD2_AutoSync',
        odometerManual: manualOdometer !== null,
      }

      const item = await addRefuelEvent(event)
      await refresh()

      if (navigator.onLine && googleDriveService.isSignedIn()) {
        try {
          await googleDriveService.uploadEvent(item.event)
          await updateItemStatus(item.id, 'synced')
        } catch (err) {
          await updateItemStatus(
            item.id,
            'error',
            err instanceof Error ? err.message : String(err)
          )
        }
        await refresh()
      }

      return item
    },
    [refresh]
  )

  const syncAll = useCallback(async () => {
    await syncPendingItems()
    await refresh()
  }, [refresh])

  const getStats = useCallback(async () => {
    const all = await getAllItems()
    return {
      total: all.length,
      synced: all.filter((i) => i.status === 'synced').length,
      pending: all.filter((i) => i.status === 'pending').length,
      errors: all.filter((i) => i.status === 'error').length,
    }
  }, [])

  return { items, pendingCount, registerRefuel, syncAll, refresh, getStats }
}
