import { data } from './data.generated.js'
import type { Brand, CompatibleMap, Device, DeviceType } from './types.js'

export type { Brand, BrandRecord, CompatibleMap, Device, DeviceData, DeviceRecord, DeviceType } from './types.js'

/** Date of the last data review, YYYY-MM-DD. */
export const updatedAt: string = data.updatedAt

export const brands: readonly Brand[] = data.brands.map((brand) => ({
  name: brand.name,
  notes: brand.notes,
  devices: brand.devices.map((device) => ({
    brand: brand.name,
    model: device.model,
    type: device.type,
    aliases: device.aliases ?? []
  }))
}))

export const devices: readonly Device[] = brands.flatMap((brand) => brand.devices)

/**
 * Lowercases, spells out "+" and drops everything except letters and digits:
 * "iPhone 15 Pro" -> "iphone15pro", "Galaxy S24+" -> "galaxys24plus".
 */
export function normalize(value: string): string {
  return value.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]/g, '')
}

function namesOf(device: Device): string[] {
  return [device.model, ...device.aliases]
}

/** Lookup keys of a device, with and without the brand prefix ("Motorola Edge 40" <-> "Edge 40"). */
function keysOf(device: Device): { global: string[]; local: string[] } {
  const brandKey = normalize(device.brand)
  const global: string[] = []
  const local: string[] = []
  for (const name of namesOf(device)) {
    const key = normalize(name)
    global.push(key)
    local.push(key)
    if (key.startsWith(brandKey) && key.length > brandKey.length) {
      local.push(key.slice(brandKey.length))
    } else {
      global.push(brandKey + key)
    }
  }
  return { global, local }
}

let index: { global: Map<string, Device>; byBrand: Map<string, Map<string, Device>> } | undefined

function getIndex() {
  if (index) return index
  const global = new Map<string, Device>()
  const byBrand = new Map<string, Map<string, Device>>()
  for (const device of devices) {
    const keys = keysOf(device)
    for (const key of keys.global) if (!global.has(key)) global.set(key, device)
    const brandKey = normalize(device.brand)
    const local = byBrand.get(brandKey) ?? new Map<string, Device>()
    for (const key of keys.local) if (!local.has(key)) local.set(key, device)
    byBrand.set(brandKey, local)
  }
  index = { global, byBrand }
  return index
}

/** Finds a brand by name, case-insensitively. */
export function getBrand(name: string): Brand | undefined {
  const key = normalize(name)
  return brands.find((brand) => normalize(brand.name) === key)
}

/**
 * Exact lookup by model name or alias, ignoring case, spaces and punctuation.
 * Pass `brand` when the model name comes without it (Android reports "Edge 40" for "Motorola Edge 40").
 */
export function findDevice(model: string, brand?: string): Device | undefined {
  const key = normalize(model)
  if (!key) return undefined
  const { global, byBrand } = getIndex()
  if (brand) {
    const brandKey = normalize(brand)
    const local = byBrand.get(brandKey)
    return local?.get(key) ?? local?.get(key.startsWith(brandKey) ? key.slice(brandKey.length) : key)
  }
  return global.get(key)
}

/**
 * True when the model is on the list. False means "not listed", not "definitely unsupported":
 * check the brand notes and the device itself (an EID under *#06#) before telling users no.
 */
export function isEsimCompatible(model: string, brand?: string): boolean {
  return findDevice(model, brand) !== undefined
}

export interface SearchOptions {
  brand?: string
  type?: DeviceType
  limit?: number
}

/** Free-text search: every word of the query must appear in the brand, model or an alias. Exact matches come first. */
export function searchDevices(query: string, options: SearchOptions = {}): Device[] {
  const words = query.toLowerCase().split(/\s+/).map(normalize).filter(Boolean)
  const brandKey = options.brand ? normalize(options.brand) : undefined
  const exact = findDevice(query, options.brand)

  const matches = devices.filter((device) => {
    if (brandKey && normalize(device.brand) !== brandKey) return false
    if (options.type && device.type !== options.type) return false
    if (words.length === 0) return true
    const haystack = normalize(device.brand) + ' ' + namesOf(device).map(normalize).join(' ')
    return words.every((word) => haystack.includes(word))
  })

  const ranked = exact && matches.includes(exact) ? [exact, ...matches.filter((device) => device !== exact)] : matches
  return options.limit === undefined ? ranked : ranked.slice(0, options.limit)
}

/** Groups model names by brand: `{ Apple: { notes, models: [...] }, ... }`. */
export function toCompatibleMap(): CompatibleMap {
  return Object.fromEntries(
    brands.map((brand) => [brand.name, { notes: [...brand.notes], models: brand.devices.map((device) => device.model) }])
  )
}
