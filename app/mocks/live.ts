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

export interface LiveTrip {
  shipmentId: string
  path: LivePoint[]
}

export const LIVE_TRIPS: LiveTrip[] = [
  { shipmentId: 'SHP-100412', path: [{ x: 120, y: 150 }, { x: 300, y: 150 }, { x: 300, y: 320 }, { x: 470, y: 320 }] },
  { shipmentId: 'SHP-100408', path: [{ x: 720, y: 110 }, { x: 720, y: 250 }, { x: 560, y: 250 }, { x: 560, y: 410 }] },
  { shipmentId: 'SHP-100401', path: [{ x: 150, y: 520 }, { x: 360, y: 520 }, { x: 360, y: 410 }, { x: 540, y: 410 }] },
  { shipmentId: 'SHP-100385', path: [{ x: 850, y: 430 }, { x: 850, y: 580 }, { x: 660, y: 580 }] },
  { shipmentId: 'SHP-100351', path: [{ x: 110, y: 330 }, { x: 110, y: 470 }, { x: 290, y: 470 }] },
  { shipmentId: 'SHP-100342', path: [{ x: 600, y: 90 }, { x: 900, y: 90 }, { x: 900, y: 250 }] },
  { shipmentId: 'SHP-100372', path: [{ x: 430, y: 600 }, { x: 760, y: 600 }, { x: 760, y: 470 }] },
]

export interface ResolvedTrip {
  shipment: Shipment
  path: LivePoint[]
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
      tone: STATUS_TONE[shipment.status],
      distanceKm: (shipment.route && findRoute(shipment.route)?.distanceKm) || 0,
    })
  }
  return out
}
