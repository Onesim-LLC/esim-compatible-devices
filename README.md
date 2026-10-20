# @onesim/esim-compatible-devices

[![npm](https://img.shields.io/npm/v/@onesim/esim-compatible-devices)](https://www.npmjs.com/package/@onesim/esim-compatible-devices)
[![CI](https://github.com/Onesim-LLC/esim-compatible-devices/actions/workflows/ci.yml/badge.svg)](https://github.com/Onesim-LLC/esim-compatible-devices/actions/workflows/ci.yml)

A curated, machine-readable list of phones and tablets that support eSIM, with lookup and search helpers.

Every eSIM seller keeps its own copy of this list on a web page. This package keeps one in JSON so apps can install it, or load it from a CDN, instead of copying it by hand. It is maintained by [Onesim](https://onesim.co) and used in Onesim's own apps.

- 29 brands, 335 devices (phones and tablets), last reviewed **2026-10-20**
- Plain JSON you can use from any language, plus a small TypeScript API with no dependencies
- Brand-level caveats (regional variants, unlock requirements) kept alongside the models

## Install

```bash
npm install @onesim/esim-compatible-devices
```

## Usage

```ts
import { findDevice, isEsimCompatible, searchDevices, getBrand } from '@onesim/esim-compatible-devices'

isEsimCompatible('iPhone 15 Pro')            // true
isEsimCompatible('Galaxy S24 Plus')          // true ("+" and "Plus" are the same)
isEsimCompatible('Edge 40', 'motorola')      // true: pass the brand when the name comes without it
findDevice('iPad mini 6')                    // { brand: 'Apple', model: 'iPad mini (2021)', type: 'tablet', aliases: [...] }
searchDevices('pixel 9', { limit: 5 })       // Pixel 9, Pixel 9 Pro, Pixel 9 Pro XL, ...
getBrand('samsung')?.notes                   // regional caveats for Samsung
```

Lookups ignore case, spaces and punctuation, and accept the model with or without the brand prefix ("Samsung Galaxy S24" or "Galaxy S24").

`isEsimCompatible` returning `false` means the model is **not on the list**, not that it can't use eSIM. Before telling a user no, check the brand notes and the device itself: if dialing `*#06#` shows an EID, the device has eSIM hardware.

### API

| Export | Description |
| --- | --- |
| `devices` | All devices: `{ brand, model, type: 'phone' \| 'tablet', aliases }[]` |
| `brands` | Devices grouped by brand, with `notes` |
| `updatedAt` | Date of the last data review, `YYYY-MM-DD` |
| `findDevice(model, brand?)` | Exact match by model name or alias |
| `isEsimCompatible(model, brand?)` | `findDevice(...) !== undefined` |
| `searchDevices(query, { brand?, type?, limit? })` | Every word of the query must appear in the brand, model or an alias; exact matches come first |
| `getBrand(name)` | Brand by name, case-insensitive |
| `toCompatibleMap()` | `{ [brand]: { notes, models: string[] } }` for UIs that group models by brand |
| `normalize(value)` | The key used for matching: `"Galaxy S24+"` becomes `"galaxys24plus"` |

## Raw JSON

The data lives in [`data/devices.json`](data/devices.json) and is described by [`data/devices.schema.json`](data/devices.schema.json):

```json
{
  "updatedAt": "2026-10-20",
  "brands": [
    {
      "name": "Apple",
      "notes": ["Your device must be unlocked and iOS must be 14.1 or newer.", "..."],
      "devices": [
        { "model": "iPhone XR", "type": "phone" },
        { "model": "iPad mini (2021)", "type": "tablet", "aliases": ["iPad mini 6", "iPad mini 6th generation"] }
      ]
    }
  ]
}
```

To get updates without shipping a new app build, load it from a CDN and pin the major version:

```
https://cdn.jsdelivr.net/npm/@onesim/esim-compatible-devices@1/data/devices.json
```

Or import it directly: `import data from '@onesim/esim-compatible-devices/devices.json' with { type: 'json' }`.

## Versioning

- **Patch:** devices or notes added, fixed or removed
- **Minor:** new optional fields or new API functions
- **Major:** a breaking change to the JSON shape or the API

## Contributing

A missing device or a wrong entry is the most useful thing to report: [open an issue](https://github.com/Onesim-LLC/esim-compatible-devices/issues/new?template=device.yml) or send a pull request. Edit `data/devices.json`, keep one device per line, and cite a source in the pull request: the manufacturer's spec page or eSIM support page is best.

```bash
npm install
npm test   # validates the JSON (duplicates, unknown fields, ambiguous names) and runs the tests
```

Rules for entries:

- Only list a device if at least one retail variant supports eSIM. Put regional exceptions in the brand's `notes`.
- Use the name the manufacturer uses. Put other common names in `aliases`.
- A name or alias may belong to one device only; the validator rejects ambiguous names.

## Disclaimer

The list is compiled from manufacturer documentation and public eSIM compatibility lists. Support also depends on the country of purchase, the carrier lock and the firmware, so treat it as a strong hint rather than a guarantee.

## License

[MIT](LICENSE)
