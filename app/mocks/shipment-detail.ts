/**
 * Per-shipment extended detail: the tracking-event timeline, package
 * manifest, documents, and route stops.
 *
 * Rather than hand-author all of this for every row, it is *derived
 * deterministically* from the shipment's own fields (status, dates,
 * locations, pieces). No Math.random / no Date.now() — same inputs always
 * produce the same output, so SSR and client agree. Real consumers swap
 * `getShipmentDetail` for an API call returning the same shape.
 */
import type { Shipment, ShipmentStatus } from './shipments'
import { findShipment, STATUS_LABELS } from './shipments'

export type EventState = 'done' | 'current' | 'pending'

export interface TrackingEvent {
  id: string
  label: string
  location: string
  time: string // ISO datetime, UTC
  state: EventState
  note?: string
}

export interface PackageLine {
  id: string
  description: string
  weightKg: number
  dims: string
}

export interface ShipmentDocument {
  id: string
  name: string
  kind: string
  date: string
}

export interface RouteStop {
  name: string
  eta: string
  state: EventState
}

export interface ShipmentDetail {
  events: TrackingEvent[]
  packages: PackageLine[]
  documents: ShipmentDocument[]
  stops: RouteStop[]
  signedBy?: string
}

function at(date: string, hour: number, minute = 0): string {
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return `${date}T${hh}:${mm}:00Z`
}

// How far through the milestone ladder each status sits. The ladder is:
// 0 received · 1 picked up · 2 departed origin · 3 in transit · 4 arrived
// destination hub · 5 out for delivery · 6 delivered.
const REACHED: Record<ShipmentStatus, number> = {
  pending: 0,
  'picked-up': 1,
  'in-transit': 3,
  delayed: 3,
  exception: 3,
  'out-for-delivery': 5,
  delivered: 6,
  returned: 6,
}

export function getShipmentDetail(id: string): ShipmentDetail | undefined {
  const s = findShipment(id)
  if (!s) return undefined
  return {
    events: buildEvents(s),
    packages: buildPackages(s),
    documents: buildDocuments(s),
    stops: buildStops(s),
    signedBy: s.status === 'delivered' ? receiver(s) : undefined,
  }
}

function receiver(s: Shipment): string {
  // Deterministic pseudo-name from the customer initials.
  const names = ['J. Romero', 'K. Patel', 'M. Foster', 'L. Nguyen', 'A. Schmidt', 'R. Okonkwo']
  const idx = s.id.charCodeAt(s.id.length - 1) % names.length
  return names[idx]!
}

function buildEvents(s: Shipment): TrackingEvent[] {
  const reached = REACHED[s.status]
  const delivered = s.actualDelivery ?? s.estimatedDelivery
  const ladder: Omit<TrackingEvent, 'state'>[] = [
    { id: 'e0', label: 'Order received', location: `${s.origin} — ${s.originCode} hub`, time: at(s.createdDate, 9, 12), note: `Label ${s.trackingNumber} generated` },
    { id: 'e1', label: 'Picked up', location: `${s.origin} origin DC`, time: at(s.shipDate, 12, 30) },
    { id: 'e2', label: 'Departed origin facility', location: `${s.origin} — ${s.originCode}`, time: at(s.shipDate, 16, 5) },
    { id: 'e3', label: 'In transit', location: s.lastLocation, time: s.lastUpdate },
    { id: 'e4', label: 'Arrived at destination hub', location: `${s.destination} — ${s.destinationCode} hub`, time: at(delivered, 6, 40) },
    { id: 'e5', label: 'Out for delivery', location: `${s.destination} delivery zone`, time: at(delivered, 8, 15) },
    { id: 'e6', label: 'Delivered', location: s.destination, time: at(delivered, 11, 25), note: s.status === 'delivered' ? `Signed by ${receiver(s)}` : undefined },
  ]

  const events = ladder.map((e, i): TrackingEvent => {
    let state: EventState = i < reached ? 'done' : i === reached ? 'current' : 'pending'
    if (s.status === 'delivered') state = 'done'
    return { ...e, state }
  })

  // Layer status-specific annotations onto the current milestone.
  const cur = events[reached]
  if (cur) {
    if (s.status === 'delayed') cur.note = `Delayed — ${s.lastLocation.split('—')[1]?.trim() ?? 'schedule slip'}. Revised ETA ${s.estimatedDelivery}.`
    if (s.status === 'exception') {
      cur.label = 'Exception reported'
      cur.note = s.lastLocation.split('—')[1]?.trim() ?? 'Held for resolution'
    }
    if (s.status === 'pending') cur.note = 'Awaiting carrier pickup'
  }

  if (s.status === 'returned') {
    events.push({ id: 'e7', label: 'Returned to sender', location: `${s.origin} returns dock`, time: at(s.actualDelivery ?? delivered, 15, 10), state: 'current', note: 'Delivery refused — routed back' })
    events[6]!.label = 'Delivery attempted'
    events[6]!.note = 'Recipient unavailable'
  }

  return events
}

function buildPackages(s: Shipment): PackageLine[] {
  const count = Math.min(s.pieces, 4)
  const per = Math.max(1, Math.round(s.weightKg / s.pieces))
  const dims = s.weightKg > 2000 ? '120 × 100 × 110 cm' : s.weightKg > 300 ? '80 × 60 × 70 cm' : '40 × 30 × 25 cm'
  const lines: PackageLine[] = []
  for (let i = 0; i < count; i++) {
    lines.push({
      id: `${s.id}-P${i + 1}`,
      description: i === count - 1 && s.pieces > count ? `${s.contents} (×${s.pieces - count + 1})` : s.contents,
      weightKg: per,
      dims,
    })
  }
  return lines
}

function buildDocuments(s: Shipment): ShipmentDocument[] {
  const docs: ShipmentDocument[] = [
    { id: `${s.id}-BOL`, name: 'Bill of Lading', kind: 'PDF', date: s.shipDate },
    { id: `${s.id}-INV`, name: 'Commercial Invoice', kind: 'PDF', date: s.createdDate },
  ]
  if (s.service === 'freight') {
    docs.push({ id: `${s.id}-MAN`, name: 'Freight Manifest', kind: 'PDF', date: s.shipDate })
  }
  if (s.status === 'delivered') {
    docs.push({ id: `${s.id}-POD`, name: 'Proof of Delivery', kind: 'PDF', date: s.actualDelivery ?? s.estimatedDelivery })
  }
  return docs
}

function buildStops(s: Shipment): RouteStop[] {
  const reached = REACHED[s.status]
  const delivered = s.actualDelivery ?? s.estimatedDelivery
  const stops: { name: string; eta: string; ladder: number }[] = [
    { name: `${s.origin} origin DC`, eta: at(s.shipDate, 12, 30), ladder: 1 },
    { name: `${s.originCode} sortation hub`, eta: at(s.shipDate, 16, 5), ladder: 2 },
    { name: s.lastLocation, eta: s.lastUpdate, ladder: 3 },
    { name: `${s.destinationCode} destination hub`, eta: at(delivered, 6, 40), ladder: 4 },
    { name: s.destination, eta: at(delivered, 11, 25), ladder: 6 },
  ]
  const base: RouteStop[] = stops.map((st) => ({
    name: st.name,
    eta: st.eta,
    state: st.ladder <= reached ? 'done' : 'pending',
  }))
  // Promote the first pending stop to "current" (unless fully delivered).
  if (s.status !== 'delivered') {
    const firstPending = base.findIndex((x) => x.state === 'pending')
    if (firstPending !== -1) base[firstPending]!.state = 'current'
  }
  return base
}

export { STATUS_LABELS }
