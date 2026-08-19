import { useState, useEffect, useCallback } from 'react'
import { obdService } from '../services/obdBluetooth'
import type { TelemetryData, ConnectionState } from '../types'

const EMPTY_TELEMETRY: TelemetryData = {
  batteryVoltage: null,
  fuelLevel: null,
  speed: null,
  rpm: null,
  odometerKm: null,
  dtcCodes: [],
}

export function useOBD() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [telemetry, setTelemetry] = useState<TelemetryData>(EMPTY_TELEMETRY)
  const [logs, setLogs] = useState<string[]>([])
  const [supported] = useState(() => obdService.isSupported())

  useEffect(() => {
    obdService.onState(setConnectionState)
    obdService.onTelemetry((data) => {
      setTelemetry(data)
    })
    obdService.onLog((msg) => {
      setLogs((prev) => {
        const next = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]
        return next.slice(-100)
      })
    })
  }, [])

  const connect = useCallback(async () => {
    await obdService.connect()
  }, [])

  const disconnect = useCallback(async () => {
    await obdService.disconnect()
    setTelemetry(EMPTY_TELEMETRY)
  }, [])

  const startReading = useCallback((intervalMs?: number) => {
    obdService.startReading(intervalMs)
  }, [])

  const stopReading = useCallback(() => {
    obdService.stopReading()
  }, [])

  const readOnce = useCallback(async () => {
    return obdService.readOnce()
  }, [])

  const sendRaw = useCallback(async (cmd: string) => {
    return obdService.sendRawCommand(cmd)
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  return {
    connectionState,
    telemetry,
    logs,
    supported,
    connect,
    disconnect,
    startReading,
    stopReading,
    readOnce,
    sendRaw,
    clearLogs,
  }
}
