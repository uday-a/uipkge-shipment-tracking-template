/**
 * Live-tracking trips for the map view. Each entry references a real
 * active shipment and adds a hand-authored polyline `path` in the map's
 * 1000×700 coordinate space (no geographic tiles — the network is
 * offline-friendly, so the "map" is a stylized vector canvas). Truck
 * position is derived from the shipment's progress along the path.
 */
import { SHIPMENTS, STATUS_TONE, type Shipment, type Tone } from './shipments'
import { findRoute } from './routes'

export interface LivePoint { x: number; y: number }
/** [lat, lng] waypoints, origin → … → destination. */
export type GeoPoint = [number, number]

export interface LiveTrip {
  shipmentId: string
  path: LivePoint[]   // 1000×700 canvas — used by the offline vector fallback
  coords: GeoPoint[]  // real lat/lng — used by the Leaflet/OpenStreetMap map
}

export const LIVE_TRIPS: LiveTrip[] = [
  { shipmentId: 'SHP-100412', path: [{ x: 120, y: 150 }, { x: 300, y: 150 }, { x: 300, y: 320 }, { x: 470, y: 320 }], coords: [[34.05, -118.24], [33.6, -112.5], [33.45, -112.07]] },
  { shipmentId: 'SHP-100408', path: [{ x: 720, y: 110 }, { x: 720, y: 250 }, { x: 560, y: 250 }, { x: 560, y: 410 }], coords: [[41.88, -87.63], [40.81, -96.70], [39.74, -104.99]] },
  { shipmentId: 'SHP-100401', path: [{ x: 150, y: 520 }, { x: 360, y: 520 }, { x: 360, y: 410 }, { x: 540, y: 410 }], coords: [[42.36, -71.06], [41.76, -72.69], [40.71, -74.01]] },
  { shipmentId: 'SHP-100385', path: [{ x: 850, y: 430 }, { x: 850, y: 580 }, { x: 660, y: 580 }], coords: [[47.61, -122.33], [47.04, -122.90], [45.52, -122.68]] },
  { shipmentId: 'SHP-100351', path: [{ x: 110, y: 330 }, { x: 110, y: 470 }, { x: 290, y: 470 }], coords: [[40.71, -74.01], [41.50, -81.69], [41.88, -87.63]] },
  { shipmentId: 'SHP-100342', path: [{ x: 600, y: 90 }, { x: 900, y: 90 }, { x: 900, y: 250 }], coords: [[40.74, -74.17], [40.72, -74.05], [40.71, -74.01]] },
  { shipmentId: 'SHP-100372', path: [{ x: 430, y: 600 }, { x: 760, y: 600 }, { x: 760, y: 470 }], coords: [[39.10, -94.58], [41.59, -93.62], [44.98, -93.27]] },
]

export interface ResolvedTrip {
  shipment: Shipment
  path: LivePoint[]
  coords: GeoPoint[]
  tone: Tone
  distanceKm: number
}

/** Resolve each live trip against the shipment ledger. */
export function resolvedTrips(): ResolvedTrip[] {
  const out: ResolvedTrip[] = []
  for (const t of LIVE_TRIPS) {
    const shipment = SHIPMENTS.find((s) => s.id === t.shipmentId)
    if (!shipment) continue
    out.push({
      shipment,
      path: t.path,
      coords: t.coords,
      tone: STATUS_TONE[shipment.status],
      distanceKm: (shipment.route && findRoute(shipment.route)?.distanceKm) || 0,
    })
  }
  return out
}
