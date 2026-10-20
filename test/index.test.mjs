import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import {
  brands,
  devices,
  findDevice,
  getBrand,
  isEsimCompatible,
  searchDevices,
  toCompatibleMap,
  updatedAt
} from '../dist/index.js'

const raw = JSON.parse(fs.readFileSync(new URL('../data/devices.json', import.meta.url), 'utf8'))

test('exposes the same data as devices.json', () => {
  assert.equal(updatedAt, raw.updatedAt)
  assert.equal(brands.length, raw.brands.length)
  assert.equal(devices.length, raw.brands.reduce((sum, brand) => sum + brand.devices.length, 0))
})

test('finds devices ignoring case, spacing and punctuation', () => {
  assert.equal(findDevice('iphone 15 pro max')?.model, 'iPhone 15 Pro Max')
  assert.equal(findDevice('IPHONE_SE_2020')?.model, 'iPhone SE (2020)')
  assert.equal(findDevice('Galaxy S24+')?.brand, 'Samsung')
})

test('finds devices with or without the brand prefix', () => {
  assert.equal(findDevice('Samsung Galaxy S24')?.model, 'Galaxy S24')
  assert.equal(findDevice('Google Pixel 9')?.model, 'Pixel 9')
  assert.equal(findDevice('Edge 40', 'motorola')?.model, 'Motorola Edge 40')
  assert.equal(findDevice('Motorola Edge 40', 'Motorola')?.model, 'Motorola Edge 40')
  assert.equal(findDevice('Samsung Galaxy S24', 'Samsung')?.model, 'Galaxy S24')
  // Without a brand, a bare model number must not match another brand's device.
  assert.equal(findDevice('13'), undefined)
})

test('resolves aliases', () => {
  assert.equal(findDevice('iPad mini 6')?.model, 'iPad mini (2021)')
  assert.equal(findDevice('Galaxy S21')?.model, 'Galaxy S21 5G')
})

test('isEsimCompatible', () => {
  assert.equal(isEsimCompatible('iPhone 17 Pro'), true)
  assert.equal(isEsimCompatible('iPhone 8'), false)
  assert.equal(isEsimCompatible(''), false)
})

test('searchDevices matches every query word and ranks exact matches first', () => {
  const results = searchDevices('iphone 15 pro')
  assert.deepEqual(results.map((device) => device.model), ['iPhone 15 Pro', 'iPhone 15 Pro Max'])
  assert.ok(searchDevices('pixel', { limit: 3 }).length === 3)
  assert.ok(searchDevices('', { brand: 'apple', type: 'tablet' }).every((device) => device.type === 'tablet'))
  assert.ok(searchDevices('galaxy tab').length > 0)
})

test('getBrand and toCompatibleMap', () => {
  assert.ok(getBrand('SAMSUNG')?.notes.length)
  const map = toCompatibleMap()
  assert.ok(map.Apple.models.includes('iPhone XR'))
  assert.deepEqual(Object.keys(map), raw.brands.map((brand) => brand.name))
})

test('"+" models do not collapse into the base model', () => {
  assert.equal(findDevice('Galaxy S24+')?.model, 'Galaxy S24+')
  assert.equal(findDevice('Galaxy S24 Plus')?.model, 'Galaxy S24+')
  assert.equal(findDevice('Galaxy S24')?.model, 'Galaxy S24')
})
