/**
 * Zepp inbound ocean containers — China factory → US port → import warehouse.
 * Hand-built, deterministic. The first leg of the supply chain; once a
 * container is `received` its bikes land in warehouse inventory.
 *
 * A container is its own unit (carries hundreds of bikes, has a vessel +
 * customs lifecycle), so it is modelled separately from the ground-movement
 * ledger. `totalBikes` / value / weight derive from the manifest.
 */
import {
  manifestUnits, manifestValueUsd, manifestWeightKg, manifestSummary,
} from './catalog'
import { findLocation } from './network'

export type ContainerStatus = 'at-sea' | 'at-port' | 'customs' | 'inland' | 'received'

export interface BikeContainer {
  id: string
  bookingRef: string
  vessel: string
  originPort: string
  originPortCode: string
  destPort: string
  destPortCode: string
  destWarehouseId: string
  manifest: Record<string, number>
  totalBikes: number
  contents: string
  valueUsd: number
  weightKg: number
  status: ContainerStatus
  departedDate: string
  etaPort: string
  receivedDate?: string
  progress: number // 0-100 across the ocean+inland journey
  lastUpdate: string
  lastLocation: string
}

export const CONTAINER_STATUS_LABELS: Record<ContainerStatus, string> = {
  'at-sea': 'At sea',
  'at-port': 'At port',
  customs: 'In customs',
  inland: 'Inland transit',
  received: 'Received',
}

export type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted'

export const CONTAINER_STATUS_TONE: Record<ContainerStatus, Tone> = {
  'at-sea': 'info',
  'at-port': 'info',
  customs: 'warning',
  inland: 'info',
  received: 'success',
}

type ContainerSeed = Omit<BikeContainer, 'totalBikes' | 'valueUsd' | 'weightKg' | 'contents'>

function build(seed: ContainerSeed): BikeContainer {
  return {
    ...seed,
    totalBikes: manifestUnits(seed.manifest),
    valueUsd: manifestValueUsd(seed.manifest),
    weightKg: manifestWeightKg(seed.manifest),
    contents: manifestSummary(seed.manifest),
  }
}

const SEEDS: ContainerSeed[] = [
  // West coast intake (→ WH-LGB, port Long Beach)
  { id: 'CTR-88142', bookingRef: 'ZP-IMP-88142', vessel: 'Ever Glory', originPort: 'Shenzhen, CN', originPortCode: 'YTN', destPort: 'Long Beach, CA', destPortCode: 'LGB', destWarehouseId: 'WH-LGB', manifest: { 'ZB-CITY': 180, 'ZB-LITE': 120, 'ZB-PRO': 60 }, status: 'received', departedDate: '2026-04-18', etaPort: '2026-05-20', receivedDate: '2026-05-24', progress: 100, lastUpdate: '2026-05-24T17:00:00Z', lastLocation: 'West Coast Import Hub — unloaded' },
  { id: 'CTR-88150', bookingRef: 'ZP-IMP-88150', vessel: 'Cosco Harmony', originPort: 'Ningbo, CN', originPortCode: 'NGB', destPort: 'Long Beach, CA', destPortCode: 'LGB', destWarehouseId: 'WH-LGB', manifest: { 'ZB-PRO': 140, 'ZB-TRAIL': 80, 'ZB-CITY': 100 }, status: 'customs', departedDate: '2026-04-30', etaPort: '2026-05-27', progress: 84, lastUpdate: '2026-05-28T09:30:00Z', lastLocation: 'Port of Long Beach — CBP exam' },
  { id: 'CTR-88163', bookingRef: 'ZP-IMP-88163', vessel: 'ONE Olympus', originPort: 'Shanghai, CN', originPortCode: 'SHA', destPort: 'Long Beach, CA', destPortCode: 'LGB', destWarehouseId: 'WH-LGB', manifest: { 'ZB-CARGO': 90, 'ZB-CITY': 140, 'ZB-LITE': 90 }, status: 'at-port', departedDate: '2026-05-02', etaPort: '2026-05-28', progress: 78, lastUpdate: '2026-05-28T06:10:00Z', lastLocation: 'Port of Long Beach — berth 142' },
  { id: 'CTR-88177', bookingRef: 'ZP-IMP-88177', vessel: 'Maersk Saigon', originPort: 'Shenzhen, CN', originPortCode: 'YTN', destPort: 'Long Beach, CA', destPortCode: 'LGB', destWarehouseId: 'WH-LGB', manifest: { 'ZB-CITY': 200, 'ZB-PRO': 100, 'ZB-FOLD': 80 }, status: 'at-sea', departedDate: '2026-05-14', etaPort: '2026-06-09', progress: 46, lastUpdate: '2026-05-28T00:00:00Z', lastLocation: 'Mid-Pacific — 168°W' },
  { id: 'CTR-88189', bookingRef: 'ZP-IMP-88189', vessel: 'Hapag Yantian', originPort: 'Qingdao, CN', originPortCode: 'TAO', destPort: 'Long Beach, CA', destPortCode: 'LGB', destWarehouseId: 'WH-LGB', manifest: { 'ZB-TRAIL': 110, 'ZB-LITE': 130, 'ZB-CITY': 120 }, status: 'at-sea', departedDate: '2026-05-21', etaPort: '2026-06-16', progress: 24, lastUpdate: '2026-05-28T00:00:00Z', lastLocation: 'East China Sea — departed' },

  // East coast intake (→ WH-EWR, port Newark)
  { id: 'CTR-77204', bookingRef: 'ZP-IMP-77204', vessel: 'MSC Pacific', originPort: 'Shanghai, CN', originPortCode: 'SHA', destPort: 'Newark, NJ', destPortCode: 'EWR', destWarehouseId: 'WH-EWR', manifest: { 'ZB-CITY': 160, 'ZB-PRO': 120, 'ZB-FOLD': 70 }, status: 'received', departedDate: '2026-04-10', etaPort: '2026-05-19', receivedDate: '2026-05-22', progress: 100, lastUpdate: '2026-05-22T15:20:00Z', lastLocation: 'East Coast Import Hub — unloaded' },
  { id: 'CTR-77218', bookingRef: 'ZP-IMP-77218', vessel: 'CMA Lyra', originPort: 'Ningbo, CN', originPortCode: 'NGB', destPort: 'Newark, NJ', destPortCode: 'EWR', destWarehouseId: 'WH-EWR', manifest: { 'ZB-PRO': 130, 'ZB-CITY': 150, 'ZB-CARGO': 60 }, status: 'inland', departedDate: '2026-04-26', etaPort: '2026-05-26', progress: 92, lastUpdate: '2026-05-28T11:00:00Z', lastLocation: 'Newark — drayage to hub' },
  { id: 'CTR-77226', bookingRef: 'ZP-IMP-77226', vessel: 'Evergreen Triton', originPort: 'Shenzhen, CN', originPortCode: 'YTN', destPort: 'Newark, NJ', destPortCode: 'EWR', destWarehouseId: 'WH-EWR', manifest: { 'ZB-FOLD': 90, 'ZB-CITY': 170, 'ZB-LITE': 110 }, status: 'customs', departedDate: '2026-05-01', etaPort: '2026-05-28', progress: 82, lastUpdate: '2026-05-28T08:45:00Z', lastLocation: 'Port of Newark — CBP hold' },
  { id: 'CTR-77235', bookingRef: 'ZP-IMP-77235', vessel: 'OOCL Atlantic', originPort: 'Shanghai, CN', originPortCode: 'SHA', destPort: 'Newark, NJ', destPortCode: 'EWR', destWarehouseId: 'WH-EWR', manifest: { 'ZB-PRO': 110, 'ZB-TRAIL': 90, 'ZB-CITY': 130 }, status: 'at-sea', departedDate: '2026-05-16', etaPort: '2026-06-14', progress: 38, lastUpdate: '2026-05-28T00:00:00Z', lastLocation: 'Indian Ocean — Suez routing' },

  // Southeast intake (→ WH-SAV, port Savannah)
  { id: 'CTR-66301', bookingRef: 'ZP-IMP-66301', vessel: 'HMM Garnet', originPort: 'Qingdao, CN', originPortCode: 'TAO', destPort: 'Savannah, GA', destPortCode: 'SAV', destWarehouseId: 'WH-SAV', manifest: { 'ZB-CITY': 150, 'ZB-CARGO': 70, 'ZB-LITE': 100 }, status: 'received', departedDate: '2026-04-14', etaPort: '2026-05-21', receivedDate: '2026-05-25', progress: 100, lastUpdate: '2026-05-25T13:00:00Z', lastLocation: 'Southeast Import Hub — unloaded' },
  { id: 'CTR-66312', bookingRef: 'ZP-IMP-66312', vessel: 'Wan Hai 305', originPort: 'Shenzhen, CN', originPortCode: 'YTN', destPort: 'Savannah, GA', destPortCode: 'SAV', destWarehouseId: 'WH-SAV', manifest: { 'ZB-TRAIL': 80, 'ZB-CITY': 140, 'ZB-PRO': 80 }, status: 'at-port', departedDate: '2026-05-03', etaPort: '2026-05-28', progress: 76, lastUpdate: '2026-05-28T07:20:00Z', lastLocation: 'Port of Savannah — Garden City terminal' },
  { id: 'CTR-66320', bookingRef: 'ZP-IMP-66320', vessel: 'Yang Ming Wisdom', originPort: 'Ningbo, CN', originPortCode: 'NGB', destPort: 'Savannah, GA', destPortCode: 'SAV', destWarehouseId: 'WH-SAV', manifest: { 'ZB-CARGO': 60, 'ZB-CITY': 160, 'ZB-FOLD': 70 }, status: 'at-sea', departedDate: '2026-05-18', etaPort: '2026-06-13', progress: 32, lastUpdate: '2026-05-28T00:00:00Z', lastLocation: 'South China Sea — en route' },
  { id: 'CTR-66334', bookingRef: 'ZP-IMP-66334', vessel: 'COSCO Aquila', originPort: 'Shanghai, CN', originPortCode: 'SHA', destPort: 'Savannah, GA', destPortCode: 'SAV', destWarehouseId: 'WH-SAV', manifest: { 'ZB-LITE': 120, 'ZB-PRO': 90, 'ZB-CITY': 110 }, status: 'inland', departedDate: '2026-04-28', etaPort: '2026-05-27', progress: 90, lastUpdate: '2026-05-28T10:30:00Z', lastLocation: 'Savannah — drayage to hub' },
  { id: 'CTR-66341', bookingRef: 'ZP-IMP-66341', vessel: 'Ever Glory', originPort: 'Shenzhen, CN', originPortCode: 'YTN', destPort: 'Savannah, GA', destPortCode: 'SAV', destWarehouseId: 'WH-SAV', manifest: { 'ZB-CITY': 190, 'ZB-LITE': 110, 'ZB-TRAIL': 70 }, status: 'at-sea', departedDate: '2026-05-23', etaPort: '2026-06-18', progress: 18, lastUpdate: '2026-05-28T00:00:00Z', lastLocation: 'Taiwan Strait — departed Yantian' },
]

export const CONTAINERS: BikeContainer[] = SEEDS.map(build)

export function findContainer(id: string): BikeContainer | undefined {
  return CONTAINERS.find((c) => c.id === id || c.bookingRef === id)
}

/** Containers still on the water or not yet received. */
export function inboundContainers(): BikeContainer[] {
  return CONTAINERS.filter((c) => c.status !== 'received')
}

export function containersFor(warehouseId: string): BikeContainer[] {
  return CONTAINERS.filter((c) => c.destWarehouseId === warehouseId)
}

// ── Ocean tracking ──────────────────────────────────────────────────
// Milestone timeline + a stylised geographic route, both derived from the
// container's status + dates so the detail page can show live tracking on a
// map (no hand-authored per-container geometry).

export interface ContainerMilestone {
  id: string
  label: string
  location: string
  date: string // ISO yyyy-mm-dd
  state: 'done' | 'current' | 'pending'
  planned?: boolean
  note?: string
}

// Which milestone (1-indexed) a status is currently sitting on.
const STATUS_STEP: Record<ContainerStatus, number> = {
  'at-sea': 3,
  'at-port': 4,
  customs: 5,
  inland: 6,
  received: 7,
}

/** Pure date math (UTC) — deterministic, SSR-safe. */
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10)
}

/** Ocean milestone timeline: booking -> departure -> transit -> arrival ->
 *  customs -> inland drayage -> received at the import warehouse. */
export function containerTracking(c: BikeContainer): ContainerMilestone[] {
  const step = STATUS_STEP[c.status]
  const wh = findLocation(c.destWarehouseId)?.name ?? c.destWarehouseId
  const mk = (i: number, id: string, label: string, location: string, date: string, note?: string): ContainerMilestone => {
    const state: ContainerMilestone['state'] =
      c.status === 'received' ? 'done' : i < step ? 'done' : i === step ? 'current' : 'pending'
    return { id, label, location, date, state, planned: state === 'pending', note }
  }
  return [
    mk(1, 'm1', 'Booking confirmed', `${c.originPort} · ${c.vessel}`, addDays(c.departedDate, -4)),
    mk(2, 'm2', `Departed ${c.originPort}`, c.originPort, c.departedDate),
    mk(3, 'm3', 'Pacific crossing', 'At sea', addDays(c.departedDate, 1), c.status === 'at-sea' ? c.lastLocation : undefined),
    mk(4, 'm4', `Arrived ${c.destPort}`, c.destPort, c.etaPort, c.status === 'at-port' ? c.lastLocation : undefined),
    mk(5, 'm5', 'Customs clearance', `${c.destPort} — CBP`, addDays(c.etaPort, 1), c.status === 'customs' ? c.lastLocation : undefined),
    mk(6, 'm6', `Inland drayage to ${wh}`, c.destPort, addDays(c.etaPort, 2)),
    mk(7, 'm7', `Received at ${wh}`, wh, c.receivedDate ?? addDays(c.etaPort, 3)),
  ]
}

// [lng, lat] for the ports. Western-hemisphere longitudes are kept real here;
// `containerGeo` offsets them by +360 so the route renders as an eastbound
// trans-Pacific arc instead of wrapping the wrong way across the map.
const PORT_COORDS: Record<string, [number, number]> = {
  YTN: [114.27, 22.57], // Yantian / Shenzhen
  SHA: [122.0, 30.9], // Shanghai
  NGB: [121.85, 29.87], // Ningbo
  TAO: [120.38, 36.07], // Qingdao
  LGB: [-118.19, 33.75], // Long Beach
  EWR: [-74.13, 40.69], // Newark
  SAV: [-81.09, 32.08], // Savannah
}

export interface ContainerGeoMarker {
  lngLat: [number, number]
  type: 'origin' | 'dest' | 'warehouse'
  label: string
}
export interface ContainerGeo {
  line: [number, number][]
  vessel: [number, number]
  markers: ContainerGeoMarker[]
}

const offset = ([lng, lat]: [number, number]): [number, number] => [lng < 0 ? lng + 360 : lng, lat]

function pointAlong(line: [number, number][], frac: number): [number, number] {
  if (line.length < 2) return line[0] ?? [0, 0]
  const segLen = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1])
  const total = line.slice(1).reduce((sum, p, i) => sum + segLen(line[i]!, p), 0)
  let target = Math.min(1, Math.max(0, frac)) * total
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]!, b = line[i]!
    const len = segLen(a, b)
    if (target <= len || i === line.length - 1) {
      const t = len === 0 ? 0 : target / len
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    }
    target -= len
  }
  return line[line.length - 1]!
}

// Open-water waypoints out of each Chinese load port — kept clear of
// Taiwan / Japan / Korea so the vessel track leaves Asia over sea, not land.
const ORIGIN_EXIT: Record<string, [number, number][]> = {
  YTN: [[118, 19], [124, 20], [133, 24]], // Shenzhen → Bashi Channel → Philippine Sea
  SHA: [[123.5, 30.5], [127, 29], [132, 29]], // Shanghai → East China Sea → S of Kyushu
  NGB: [[123.5, 29.5], [127, 28], [132, 28]], // Ningbo → East China Sea → S of Kyushu
  TAO: [[122, 35], [125.5, 33.5], [129, 33], [134, 32]], // Qingdao → Yellow Sea → Korea Strait → S of Japan
}

// Trans-ocean lane from open Pacific to each US port (longitudes carried past
// 180 so the line runs continuously eastward). West coast = North-Pacific
// great-circle arc approaching California from the sea; east coast = lower
// Pacific, through the Panama Canal, then up the Atlantic seaboard staying
// offshore — so the track threads the canal instead of striding over land.
const DEST_ROUTE: Record<string, [number, number][]> = {
  LGB: [[150, 34], [170, 40], [195, 43], [218, 40], [233, 36], [239, 34], [241.81, 33.75]],
  EWR: [[150, 28], [175, 22], [200, 16], [225, 12], [250, 9], [272, 8], [281, 8.8], [280.6, 9.5], [282.5, 14], [284, 19], [285, 24], [285.5, 29], [286, 34], [286.2, 38.5], [286.1, 40.5], [285.87, 40.69]],
  SAV: [[150, 28], [175, 22], [200, 16], [225, 12], [250, 9], [272, 8], [281, 8.8], [280.6, 9.5], [282.5, 14], [283.5, 19], [282, 25], [281, 29], [280, 31], [279.6, 31.9], [278.91, 32.08]],
}

/** Real-world-ish ocean route (origin port → Pacific lane → US port →
 *  warehouse) + the vessel's current spot interpolated along it. */
export function containerGeo(c: BikeContainer): ContainerGeo {
  const origin = PORT_COORDS[c.originPortCode] ?? [120, 30]
  const destPort = PORT_COORDS[c.destPortCode] ?? [-118, 34]
  const whLoc = findLocation(c.destWarehouseId)
  const wh = whLoc ? offset([whLoc.coords[1], whLoc.coords[0]]) : offset(destPort)
  const exit = ORIGIN_EXIT[c.originPortCode] ?? []
  const dest = DEST_ROUTE[c.destPortCode] ?? [offset(destPort)]
  const line: [number, number][] = [origin, ...exit, ...dest, wh]
  return {
    line,
    vessel: pointAlong(line, c.progress / 100),
    markers: [
      { lngLat: origin, type: 'origin', label: c.originPort },
      { lngLat: offset(destPort), type: 'dest', label: c.destPort },
      { lngLat: wh, type: 'warehouse', label: whLoc?.name ?? 'Import warehouse' },
    ],
  }
}
