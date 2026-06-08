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
import { findConsumer } from './consumers'

export type EventState = 'done' | 'current' | 'pending'

export interface TrackingEvent {
  id: string
  label: string
  location: string
  time: string // ISO datetime, UTC
  state: EventState
  note?: string
  /** True for not-yet-reached steps: `time` is a planned ETA, not a real scan. */
  planned?: boolean
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
  /** True when this stop hasn't been reached: `eta` is planned, not actual. */
  planned?: boolean
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

/** Same-format ISO (UTC) `addMin` minutes after `iso`. Deterministic. */
function isoBump(iso: string, addMin: number): string {
  const d = new Date(Date.parse(iso) + addMin * 60_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00Z`
}

/**
 * Keep a derived timeline strictly forward-moving. A borrowed live scan
 * (lastUpdate) or a synthesised hour can land *before* the rung above it —
 * e.g. a same-day last-mile where morning "arrived" hours predate an
 * afternoon scan — which reads as fabricated, out-of-order history. Clamp
 * each step to at least `gapMin` after the previous one. ISO UTC strings of
 * equal width compare lexically == chronologically.
 */
function clampChrono(rows: { time?: string; eta?: string }[], key: 'time' | 'eta', gapMin = 4): void {
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]![key]!
    const curr = rows[i]![key]!
    if (curr < prev) rows[i]![key] = isoBump(prev, gapMin)
  }
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
  const lastMile = s.leg === 'last-mile'
  // For last-mile the recipient is a real consumer (id mirrored on consumerId).
  const consumer = lastMile && s.consumerId ? findConsumer(s.consumerId) : undefined
  const destPlace = consumer ? `${consumer.address}, ${consumer.city}` : s.destination
  // Only borrow the live scan for the "In transit" rung once the move has
  // actually departed (reached >= 3); otherwise synthesise a planned waypoint
  // so a not-yet-shipped movement doesn't show a past-dated origin-queue scan.
  const departed = reached >= 3
  const ladder: Omit<TrackingEvent, 'state'>[] = [
    { id: 'e0', label: 'Order received', location: lastMile ? s.origin : `${s.origin} — ${s.originCode} hub`, time: at(s.createdDate, 9, 12), note: `Label ${s.trackingNumber} generated` },
    // Last-mile loads + leaves the DC in the morning (delivery run that day);
    // a transfer / line-haul departs midday for an overnight haul.
    { id: 'e1', label: 'Picked up', location: lastMile ? s.origin : `${s.origin} origin DC`, time: at(s.shipDate, lastMile ? 7 : 12, 30) },
    { id: 'e2', label: lastMile ? 'Departed distribution center' : 'Departed origin facility', location: lastMile ? s.origin : `${s.origin} — ${s.originCode}`, time: at(s.shipDate, lastMile ? 8 : 16, lastMile ? 15 : 5) },
    { id: 'e3', label: 'In transit', location: departed ? s.lastLocation : (lastMile ? `${s.destinationCode} delivery route` : `${s.destinationCode} line-haul`), time: departed ? s.lastUpdate : at(s.shipDate, 18, 0) },
    { id: 'e4', label: lastMile ? 'Arrived in delivery area' : 'Arrived at destination hub', location: lastMile ? consumer?.city ?? s.destination : `${s.destination} — ${s.destinationCode} hub`, time: at(delivered, 6, 40) },
    { id: 'e5', label: 'Out for delivery', location: lastMile ? destPlace : `${s.destination} delivery zone`, time: at(delivered, 8, 15) },
    { id: 'e6', label: 'Delivered', location: destPlace, time: at(delivered, 11, 25), note: s.status === 'delivered' ? `Signed by ${consumer?.name ?? receiver(s)}` : undefined },
  ]

  const events = ladder.map((e, i): TrackingEvent => {
    let state: EventState = i < reached ? 'done' : i === reached ? 'current' : 'pending'
    if (s.status === 'delivered') state = 'done'
    // Future steps carry a planned ETA, not a real scan time.
    return { ...e, state, planned: state === 'pending' }
  })

  // Layer status-specific annotations onto the current milestone.
  const cur = events[reached]
  if (cur) {
    if (s.status === 'delayed') cur.note = `Delayed — ${s.lastLocation.split('—')[1]?.trim() ?? 'schedule slip'}. Revised ETA ${s.estimatedDelivery}.`
    if (s.status === 'exception') {
      cur.label = 'Exception reported'
      cur.note = s.lastLocation.split('—')[1]?.trim() ?? 'Held for resolution'
    }
    // Don't clobber an authored note (e0 carries the label-generated note).
    if (s.status === 'pending') cur.note = cur.note ? `${cur.note} · Awaiting carrier pickup` : 'Awaiting carrier pickup'
  }

  if (s.status === 'returned') {
    events.push({ id: 'e7', label: 'Returned to sender', location: `${s.origin} returns dock`, time: at(s.actualDelivery ?? delivered, 15, 10), state: 'current', note: 'Delivery refused — routed back' })
    events[6]!.label = 'Delivery attempted'
    events[6]!.note = 'Recipient unavailable'
  }

  clampChrono(events, 'time')
  return events
}

function buildPackages(s: Shipment): PackageLine[] {
  const count = Math.min(s.pieces, 4)
  const per = Math.max(1, Math.round(s.weightKg / s.pieces))
  // A boxed ebike ships in a long flat carton (~bike length), not a parcel;
  // multi-bike transfers move on pallets / in cages.
  const dims = s.weightKg > 2000 ? '120 × 100 × 110 cm' : s.weightKg > 300 ? '80 × 60 × 70 cm' : '147 × 30 × 80 cm'
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
  const lastMile = s.leg === 'last-mile'
  const consumer = lastMile && s.consumerId ? findConsumer(s.consumerId) : undefined
  const departed = reached >= 3
  // Only show the live position as the in-transit waypoint once the move has
  // departed; otherwise synthesise a planned waypoint so the ladder stays
  // chronological (lastUpdate can predate shipDate for a pending pickup).
  const transitName = departed
    ? s.lastLocation
    : (lastMile ? `${s.destinationCode} delivery route` : `${s.destinationCode} line-haul`)
  const transitEta = departed ? s.lastUpdate : at(s.shipDate, 18, 0)

  // Last-mile is a short DC → route → consumer hop; transfer is the full
  // warehouse → sortation → hub → destination lane.
  const stops: { name: string; eta: string; ladder: number }[] = lastMile
    ? [
        { name: s.origin, eta: at(s.shipDate, 8, 15), ladder: 2 },
        { name: transitName, eta: transitEta, ladder: 3 },
        { name: consumer ? `${consumer.name} — ${consumer.address}` : s.destination, eta: at(delivered, 11, 25), ladder: 6 },
      ]
    : [
        { name: `${s.origin} origin DC`, eta: at(s.shipDate, 12, 30), ladder: 1 },
        { name: `${s.originCode} sortation hub`, eta: at(s.shipDate, 16, 5), ladder: 2 },
        { name: transitName, eta: transitEta, ladder: 3 },
        { name: `${s.destinationCode} destination hub`, eta: at(delivered, 6, 40), ladder: 4 },
        { name: s.destination, eta: at(delivered, 11, 25), ladder: 6 },
      ]
  const base: RouteStop[] = stops.map((st) => {
    const done = st.ladder <= reached
    return { name: st.name, eta: st.eta, state: done ? 'done' : 'pending', planned: !done }
  })
  // Promote the first pending stop to "current" (unless fully delivered).
  if (s.status !== 'delivered') {
    const firstPending = base.findIndex((x) => x.state === 'pending')
    if (firstPending !== -1) base[firstPending]!.state = 'current'
  }
  clampChrono(base, 'eta')
  return base
}

export { STATUS_LABELS }
