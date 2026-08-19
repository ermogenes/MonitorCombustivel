export type ConnectionState = 'disconnected' | 'connecting' | 'ready' | 'reading'

export type SyncStatus = 'pending' | 'synced' | 'error'

export interface TelemetryData {
  batteryVoltage: number | null
  fuelLevel: number | null
  speed: number | null
  rpm: number | null
  odometerKm: number | null
  dtcCodes: string[]
}

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracyMeters: number
}

export interface RefuelEvent {
  id: string
  tipo_evento: 'ABASTECIMENTO'
  versao_schema: '1.0'
  timestamp: string
  odometro_km: number
  tanque_combustivel_pct: number
  bateria_v: number
  geolocalizacao: GeoLocation | null
  diagnosticos_dtc: string[]
  origem: 'PWA_OBD2_AutoSync'
  odometerManual: boolean
}

export interface SyncQueueItem {
  id: string
  event: RefuelEvent
  status: SyncStatus
  createdAt: string
  lastAttempt: string | null
  error: string | null
}

export interface Settings {
  odometerManual: number | null
  driveFolder: string
}
