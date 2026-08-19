/* eslint-disable @typescript-eslint/no-empty-object-type */

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name: string | null
  readonly gatt?: BluetoothRemoteGATTServer
  readonly ongattserverdisconnected: ((this: BluetoothDevice, ev: Event) => any) | null
  addEventListener(type: 'gattserverdisconnected', listener: (this: BluetoothDevice, ev: Event) => any): void
  addEventListener<K extends keyof BluetoothDeviceEventMap>(type: K, listener: (this: BluetoothDevice, ev: BluetoothDeviceEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
}

interface BluetoothDeviceEventMap {
  gattserverdisconnected: Event
}

interface BluetoothRemoteGATTServer {
  readonly device: BluetoothDevice
  readonly connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>
  getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>
}

interface BluetoothRemoteGATTService {
  readonly device: BluetoothDevice
  readonly uuid: string
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>
  getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly service: BluetoothRemoteGATTService
  readonly uuid: string
  readonly value?: DataView
  readValue(): Promise<DataView>
  writeValue(value: BufferSource): Promise<void>
  writeValueWithoutResponse(value: BufferSource): Promise<void>
  writeValueWithResponse(value: BufferSource): Promise<void>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  oncharacteristicvaluechanged: ((this: BluetoothRemoteGATTCharacteristic, ev: Event) => any) | null
  addEventListener(type: 'characteristicvaluechanged', listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => any): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
}

interface BluetoothRequestDeviceOptions {
  filters?: BluetoothLEScanFilter[]
  optionalServices?: (string | number)[]
  acceptAllDevices?: boolean
}

interface BluetoothLEScanFilter {
  services?: (string | number)[]
  name?: string
  namePrefix?: string
  manufacturerData?: Record<number, DataView>
  serviceData?: Record<string, DataView>
}

interface Navigator {
  bluetooth?: {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>
    getDevices(): Promise<BluetoothDevice[]>
    requestAdvertisement(): Promise<BluetoothAdvertisement>
  }
}

interface BluetoothAdvertisement {
  readonly device: BluetoothDevice
  readonly rssi: number
  readonly txPower?: number
}
