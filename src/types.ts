export type DeviceType = 'phone' | 'tablet'

/** Device entry as stored in data/devices.json. */
export interface DeviceRecord {
  model: string
  type: DeviceType
  aliases?: string[]
}

export interface BrandRecord {
  name: string
  /** Caveats for the whole brand: regional variants, unlock requirements, etc. */
  notes: string[]
  devices: DeviceRecord[]
}

export interface DeviceData {
  /** Date of the last data review, YYYY-MM-DD. */
  updatedAt: string
  brands: BrandRecord[]
}

export interface Device {
  brand: string
  model: string
  type: DeviceType
  aliases: string[]
}

export interface Brand {
  name: string
  notes: string[]
  devices: Device[]
}

/** Shape used by apps that group models by brand: `{ Apple: { notes, models: ['iPhone XR', ...] } }`. */
export type CompatibleMap = Record<string, { notes: string[]; models: string[] }>
