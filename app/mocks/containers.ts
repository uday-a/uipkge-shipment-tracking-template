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
