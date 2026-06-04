/**
 * Zepp physical network — import warehouses + distribution centers.
 * Hand-built, deterministic. Replaces the old flat `warehouses.ts`.
 *
 * Two tiers:
 *   - warehouse: large hub near a US port; receives ocean containers, holds
 *     bulk stock, replenishes its child DCs.
 *   - dc: local distribution center; pulls from its parent warehouse and
 *     fulfils consumer last-mile orders nearby.
 *
 * `parentId` links a DC to its warehouse; `portCode` is the US port a
 * warehouse imports through. Codes are reused as origin/dest codes on
 * movements + containers, so keep them stable.
 */

export type LocationType = 'warehouse' | 'dc'
export type LocationStatus = 'operational' | 'near-capacity' | 'maintenance'

export interface NetworkLocation {
  id: string
  name: string
  type: LocationType
  city: string
  code: string
  parentId?: string // dc → import warehouse
  portCode?: string // warehouse → US port of entry
  coords: [number, number] // [lat, lng] — for the live map
  capacityPct: number
  inboundToday: number
  outboundToday: number
  staff: number
  sqft: number
  status: LocationStatus
}

export const LOCATION_STATUS_LABELS: Record<LocationStatus, string> = {
  operational: 'Operational',
  'near-capacity': 'Near capacity',
  maintenance: 'Maintenance',
}

export const LOCATION_STATUS_TONE: Record<LocationStatus, 'success' | 'warning' | 'muted'> = {
  operational: 'success',
  'near-capacity': 'warning',
  maintenance: 'muted',
}

export const NETWORK: NetworkLocation[] = [
  // ── Import warehouses (near ports) ──────────────────────────────────
  { id: 'WH-LGB', name: 'West Coast Import Hub', type: 'warehouse', city: 'Long Beach, CA', code: 'LGB', portCode: 'LGB', coords: [33.77, -118.19], capacityPct: 81, inboundToday: 540, outboundToday: 320, staff: 184, sqft: 420000, status: 'operational' },
  { id: 'WH-EWR', name: 'East Coast Import Hub', type: 'warehouse', city: 'Newark, NJ', code: 'EWR', portCode: 'EWR', coords: [40.73, -74.17], capacityPct: 92, inboundToday: 410, outboundToday: 280, staff: 156, sqft: 360000, status: 'near-capacity' },
  { id: 'WH-SAV', name: 'Southeast Import Hub', type: 'warehouse', city: 'Savannah, GA', code: 'SAV', portCode: 'SAV', coords: [32.08, -81.09], capacityPct: 64, inboundToday: 300, outboundToday: 210, staff: 128, sqft: 300000, status: 'operational' },

  // ── Distribution centers → West (WH-LGB) ────────────────────────────
  { id: 'DC-LAX', name: 'Los Angeles DC', type: 'dc', city: 'Los Angeles, CA', code: 'LAX', parentId: 'WH-LGB', coords: [34.05, -118.24], capacityPct: 74, inboundToday: 86, outboundToday: 92, staff: 64, sqft: 96000, status: 'operational' },
  { id: 'DC-SFO', name: 'Bay Area DC', type: 'dc', city: 'San Francisco, CA', code: 'SFO', parentId: 'WH-LGB', coords: [37.77, -122.42], capacityPct: 88, inboundToday: 71, outboundToday: 78, staff: 58, sqft: 84000, status: 'near-capacity' },
  { id: 'DC-SEA', name: 'Seattle DC', type: 'dc', city: 'Seattle, WA', code: 'SEA', parentId: 'WH-LGB', coords: [47.61, -122.33], capacityPct: 61, inboundToday: 44, outboundToday: 49, staff: 41, sqft: 62000, status: 'operational' },
  { id: 'DC-PHX', name: 'Phoenix DC', type: 'dc', city: 'Phoenix, AZ', code: 'PHX', parentId: 'WH-LGB', coords: [33.45, -112.07], capacityPct: 69, inboundToday: 52, outboundToday: 57, staff: 46, sqft: 70000, status: 'operational' },
  { id: 'DC-DEN', name: 'Denver DC', type: 'dc', city: 'Denver, CO', code: 'DEN', parentId: 'WH-LGB', coords: [39.74, -104.99], capacityPct: 93, inboundToday: 38, outboundToday: 31, staff: 37, sqft: 58000, status: 'near-capacity' },

  // ── Distribution centers → East (WH-EWR) ────────────────────────────
  { id: 'DC-JFK', name: 'New York DC', type: 'dc', city: 'New York, NY', code: 'JFK', parentId: 'WH-EWR', coords: [40.71, -74.01], capacityPct: 85, inboundToday: 79, outboundToday: 84, staff: 62, sqft: 90000, status: 'operational' },
  { id: 'DC-BOS', name: 'Boston DC', type: 'dc', city: 'Boston, MA', code: 'BOS', parentId: 'WH-EWR', coords: [42.36, -71.06], capacityPct: 72, inboundToday: 48, outboundToday: 53, staff: 44, sqft: 66000, status: 'operational' },
  { id: 'DC-ORD', name: 'Chicago DC', type: 'dc', city: 'Chicago, IL', code: 'ORD', parentId: 'WH-EWR', coords: [41.88, -87.63], capacityPct: 77, inboundToday: 63, outboundToday: 67, staff: 55, sqft: 82000, status: 'operational' },
  { id: 'DC-EWR', name: 'Newark City DC', type: 'dc', city: 'Newark, NJ', code: 'EWR', parentId: 'WH-EWR', coords: [40.68, -74.07], capacityPct: 90, inboundToday: 41, outboundToday: 45, staff: 39, sqft: 60000, status: 'near-capacity' },

  // ── Distribution centers → Southeast (WH-SAV) ───────────────────────
  { id: 'DC-ATL', name: 'Atlanta DC', type: 'dc', city: 'Atlanta, GA', code: 'ATL', parentId: 'WH-SAV', coords: [33.75, -84.39], capacityPct: 70, inboundToday: 58, outboundToday: 62, staff: 50, sqft: 76000, status: 'operational' },
  { id: 'DC-MIA', name: 'Miami DC', type: 'dc', city: 'Miami, FL', code: 'MIA', parentId: 'WH-SAV', coords: [25.76, -80.19], capacityPct: 46, inboundToday: 29, outboundToday: 34, staff: 33, sqft: 54000, status: 'maintenance' },
  { id: 'DC-DFW', name: 'Dallas DC', type: 'dc', city: 'Dallas, TX', code: 'DFW', parentId: 'WH-SAV', coords: [32.78, -96.80], capacityPct: 66, inboundToday: 55, outboundToday: 59, staff: 48, sqft: 74000, status: 'operational' },
]

const BY_ID: Record<string, NetworkLocation> = Object.fromEntries(NETWORK.map((l) => [l.id, l]))

export function findLocation(id: string): NetworkLocation | undefined {
  return BY_ID[id]
}

/** Short label for a location id (falls back to the raw id). */
export function locationName(id: string): string {
  return BY_ID[id]?.name ?? id
}

export function warehouses(): NetworkLocation[] {
  return NETWORK.filter((l) => l.type === 'warehouse')
}

export function distributionCenters(): NetworkLocation[] {
  return NETWORK.filter((l) => l.type === 'dc')
}

/** DCs replenished from a given warehouse. */
export function dcsFor(warehouseId: string): NetworkLocation[] {
  return NETWORK.filter((l) => l.type === 'dc' && l.parentId === warehouseId)
}
