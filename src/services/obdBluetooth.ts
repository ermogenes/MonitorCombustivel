import type { TelemetryData, ConnectionState } from '../types'

type StateCallback = (state: ConnectionState) => void
type TelemetryCallback = (data: TelemetryData) => void
type LogCallback = (msg: string) => void

const BLE_SERVICES = [
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
  '0000fff0-0000-1000-8000-00805f9b34fb', // Common ELM327
  '0000ffe0-0000-1000-8000-00805f9b34fb', // SPP-like
]

const SERIAL_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const SERIAL_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
const SERIAL_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'

let device: BluetoothDevice | null = null
let server: BluetoothRemoteGATTServer | null = null
let txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
let rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null

let onStateChange: StateCallback = () => {}
let onTelemetry: TelemetryCallback = () => {}
let onLog: LogCallback = () => {}

let currentState: ConnectionState = 'disconnected'
let readInterval: ReturnType<typeof setInterval> | null = null
let pendingResolve: ((value: string) => void) | null = null
let receiveBuffer = ''

function setState(s: ConnectionState) {
  currentState = s
  onStateChange(s)
}

function log(msg: string) {
  onLog(msg)
}

function isWebBluetoothSupported(): boolean {
  return 'bluetooth' in navigator && !!navigator.bluetooth
}

async function sendCommand(cmd: string): Promise<string> {
  if (!txCharacteristic) throw new Error('Not connected')

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingResolve = null
      reject(new Error(`Timeout: ${cmd}`))
    }, 5000)

    pendingResolve = (value: string) => {
      clearTimeout(timeout)
      pendingResolve = null
      resolve(value)
    }

    const encoder = new TextEncoder()
    txCharacteristic!.writeValue(encoder.encode(cmd + '\r'))
  })
}

function handleNotification(event: Event) {
  const characteristic = event.target as BluetoothRemoteGATTCharacteristic
  const decoder = new TextDecoder()
  const text = decoder.decode(characteristic.value!)
  receiveBuffer += text

  if (receiveBuffer.includes('>')) {
    const cleanResponse = receiveBuffer
      .replace(/>/g, '')
      .replace(/[\r\n]+/g, '\n')
      .trim()
    receiveBuffer = ''
    if (pendingResolve) {
      pendingResolve(cleanResponse)
    }
  }
}

async function initializeELM327(): Promise<void> {
  const commands = ['AT Z', 'AT E0', 'AT L0', 'AT SP 0']
  for (const cmd of commands) {
    log(`→ ${cmd}`)
    const resp = await sendCommand(cmd)
    log(`← ${resp}`)
    await new Promise((r) => setTimeout(r, 200))
  }
  log('ELM327 inicializado')
}

async function readTelemetry(): Promise<TelemetryData> {
  const data: TelemetryData = {
    batteryVoltage: null,
    fuelLevel: null,
    speed: null,
    rpm: null,
    odometerKm: null,
    dtcCodes: [],
  }

  try {
    const voltageResp = await sendCommand('AT RV')
    const voltageMatch = voltageResp.match(/([\d.]+)V/i)
    if (voltageMatch) data.batteryVoltage = parseFloat(voltageMatch[1])
  } catch { /* skip */ }

  await new Promise((r) => setTimeout(r, 100))

  try {
    const fuelResp = await sendCommand('012F')
    const fuelMatch = fuelResp.match(/012F\s*([0-9A-F]{2})/i)
    if (fuelMatch) {
      const a = parseInt(fuelMatch[1], 16)
      data.fuelLevel = Math.round((a * 100) / 255 * 10) / 10
    }
  } catch { /* skip */ }

  await new Promise((r) => setTimeout(r, 100))

  try {
    const speedResp = await sendCommand('010D')
    const speedMatch = speedResp.match(/010D\s*([0-9A-F]{2})/i)
    if (speedMatch) {
      data.speed = parseInt(speedMatch[1], 16)
    }
  } catch { /* skip */ }

  await new Promise((r) => setTimeout(r, 100))

  try {
    const rpmResp = await sendCommand('010C')
    const rpmMatch = rpmResp.match(/010C\s*([0-9A-F]{2})([0-9A-F]{2})/i)
    if (rpmMatch) {
      data.rpm = Math.round(
        ((parseInt(rpmMatch[1], 16) * 256 + parseInt(rpmMatch[2], 16)) / 4)
      )
    }
  } catch { /* skip */ }

  await new Promise((r) => setTimeout(r, 100))

  try {
    const odoResp = await sendCommand('01A6')
    const odoMatch = odoResp.match(/01A6\s*([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i)
    if (odoMatch) {
      const raw =
        parseInt(odoMatch[1], 16) * 65536 +
        parseInt(odoMatch[2], 16) * 256 +
        parseInt(odoMatch[3], 16)
      data.odometerKm = Math.round(raw / 10)
    }
  } catch { /* skip */ }

  try {
    const dtcResp = await sendCommand('03')
    if (dtcResp && !dtcResp.includes('NO DATA') && !dtcResp.includes('ERROR')) {
      const codes = dtcResp.match(/[0-9A-F]{4}/gi)
      if (codes) {
        data.dtcCodes = codes
          .map((c) => {
            const letters = 'PCBU'
            const l = letters[parseInt(c[0], 16)] || 'P'
            return `${l}${c.slice(1)}`
          })
          .filter((c) => c !== 'P0000')
      }
    }
  } catch { /* skip */ }

  return data
}

export const obdService = {
  isSupported: isWebBluetoothSupported,

  onState(cb: StateCallback) {
    onStateChange = cb
  },
  onTelemetry(cb: TelemetryCallback) {
    onTelemetry = cb
  },
  onLog(cb: LogCallback) {
    onLog = cb
  },

  getState(): ConnectionState {
    return currentState
  },

  async connect(): Promise<void> {
    if (!isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth não suportado neste navegador')
    }

    setState('connecting')
    log('Procurando adaptador OBD-II...')

    try {
      if (!navigator.bluetooth) throw new Error('Web Bluetooth não suportado')
      device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SERIAL_SERVICE] },
          { services: ['0000fff0-0000-1000-8000-00805f9b34fb'] },
          { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] },
        ],
        optionalServices: BLE_SERVICES,
      })

      log(`Dispositivo: ${device.name || 'Desconhecido'}`)

      device.addEventListener('gattserverdisconnected', () => {
        log('Dispositivo desconectado')
        obdService.stopReading()
        setState('disconnected')
      })

      server = await device.gatt!.connect()
      log('GATT conectado')

      let service: BluetoothRemoteGATTService | null = null
      for (const svcId of BLE_SERVICES) {
        try {
          service = await server.getPrimaryService(svcId)
          if (service) break
        } catch { /* try next */ }
      }

      if (!service) {
        throw new Error('Serviço serial BLE não encontrado')
      }

      txCharacteristic = await service.getCharacteristic(SERIAL_TX)
      rxCharacteristic = await service.getCharacteristic(SERIAL_RX)

      await rxCharacteristic.startNotifications()
      rxCharacteristic.addEventListener('characteristicvaluechanged', handleNotification)

      setState('ready')
      log('Conectado ao ELM327')

      await initializeELM327()
    } catch (err) {
      setState('disconnected')
      log(`Erro: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }
  },

  async disconnect(): Promise<void> {
    obdService.stopReading()
    if (rxCharacteristic) {
      rxCharacteristic.removeEventListener('characteristicvaluechanged', handleNotification)
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }
    device = null
    server = null
    txCharacteristic = null
    rxCharacteristic = null
    setState('disconnected')
    log('Desconectado')
  },

  startReading(intervalMs = 2000): void {
    obdService.stopReading()
    setState('reading')
    const tick = async () => {
      if (currentState !== 'reading') return
      try {
        const data = await readTelemetry()
        onTelemetry(data)
      } catch (err) {
        log(`Erro leitura: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    tick()
    readInterval = setInterval(tick, intervalMs)
  },

  stopReading(): void {
    if (readInterval) {
      clearInterval(readInterval)
      readInterval = null
    }
    if (currentState === 'reading') {
      setState('ready')
    }
  },

  async readOnce(): Promise<TelemetryData> {
    if (!txCharacteristic) throw new Error('Não conectado')
    return readTelemetry()
  },

  async sendRawCommand(cmd: string): Promise<string> {
    if (!txCharacteristic) throw new Error('Não conectado')
    return sendCommand(cmd)
  },
}
