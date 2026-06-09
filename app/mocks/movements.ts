/**
 * Zepp internal movement ledger — the SOURCE OF TRUTH. Replaces the old
 * generic `shipments.ts`. Hand-built, deterministic (no Math.random /
 * Date.now() at module scope) so SSR + client render identically.
 *
 * Two legs share this ledger because both are truck/ground moves with the
 * same origin→dest→driver→progress→ETA shape (so the control tower, live
 * map, tracking timeline and detail page reuse it directly):
 *   - transfer:  import warehouse → distribution center (bulk replenishment)
 *   - last-mile: distribution center → D2C consumer home (1–few bikes)
 *
 * Inbound ocean (China → warehouse) is modelled separately in `containers.ts`
 * because a container is a different unit (many bikes, vessel, customs).
 *
 * Per-movement totals (units / weight / value / summary) are DERIVED from the
 * bike manifest via the catalog helpers, so they can never drift.
 *
 * Field naming keeps the old shipment names (origin/destination/customer/…)
 * so the cutover from `shipments.ts` is mechanical; `shipments.ts` is now a
 * thin re-export shim over this module.
 */
import {
  manifestUnits, manifestValueUsd, manifestWeightKg, manifestSummary,
} from './catalog'

export const TODAY = '2026-05-28'

export type ShipmentStatus =
  | 'pending'
  | 'picked-up'
  | 'in-transit'
  | 'out-for-delivery'
  | 'delivered'
  | 'delayed'
  | 'exception'
  | 'returned'

export type ServiceLevel = 'same-day' | 'overnight' | 'express' | 'standard' | 'freight'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type MovementLeg = 'transfer' | 'last-mile'

export interface Movement {
  id: string
  trackingNumber: string
  leg: MovementLeg
  status: ShipmentStatus
  priority: Priority
  // Origin / destination — labels keep the old field names; ids resolve to a
  // NetworkLocation (transfer dest + both origins) or a Consumer (last-mile dest).
  originId: string
  origin: string
  originCode: string
  destId: string
  destination: string
  destinationCode: string
  // Legacy aliases: `customer` = the receiving party (DC name for a transfer,
  // consumer name for last-mile); `customerId` mirrors destId.
  customer: string
  customerId: string
  consumerId?: string // last-mile only
  carrier: string
  service: ServiceLevel
  // Bikes — manifest is authored; the rest are derived in `build()`.
  manifest: Record<string, number>
  totalBikes: number
  pieces: number
  weightKg: number
  contents: string
  valueUsd: number
  costUsd: number
  driver?: string
  vehicle?: string
  route?: string
  createdDate: string
  shipDate: string
  estimatedDelivery: string
  actualDelivery?: string
  progress: number
  lastUpdate: string
  lastLocation: string
}

export const CARRIERS = [
  'Zepp Linehaul',
  'Pacific Drayage',
  'RoadRunner Logistics',
  'Sunbelt Freight',
  'Metro Courier',
] as const

export const SERVICE_LEVELS: ServiceLevel[] = ['same-day', 'overnight', 'express', 'standard', 'freight']
export const STATUSES: ShipmentStatus[] = [
  'pending',
  'picked-up',
  'in-transit',
  'out-for-delivery',
  'delivered',
  'delayed',
  'exception',
  'returned',
]
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical']
export const MOVEMENT_LEGS: MovementLeg[] = ['transfer', 'last-mile']

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: 'Pending',
  'picked-up': 'Picked up',
  'in-transit': 'In transit',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  delayed: 'Delayed',
  exception: 'Exception',
  returned: 'Returned',
}

export type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted'

export const STATUS_TONE: Record<ShipmentStatus, Tone> = {
  pending: 'muted',
  'picked-up': 'info',
  'in-transit': 'info',
  'out-for-delivery': 'info',
  delivered: 'success',
  delayed: 'warning',
  exception: 'destructive',
  returned: 'muted',
}

export const SERVICE_LABELS: Record<ServiceLevel, string> = {
  'same-day': 'Same-day',
  overnight: 'Overnight',
  express: 'Express',
  standard: 'Standard',
  freight: 'Line-haul',
}

export const LEG_LABELS: Record<MovementLeg, string> = {
  transfer: 'WH → DC transfer',
  'last-mile': 'Last-mile delivery',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const PRIORITY_TONE: Record<Priority, Tone> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  critical: 'destructive',
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`
  return `${kg} kg`
}

export function formatMoney(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`
  if (usd >= 10_000) return `$${Math.round(usd / 1000)}k`
  return `$${usd.toLocaleString('en-US')}`
}

/** Seed = a movement with the derived fields omitted; `build` fills them. */
type MovementSeed = Omit<Movement, 'totalBikes' | 'pieces' | 'weightKg' | 'valueUsd' | 'contents'>

function build(seed: MovementSeed): Movement {
  const totalBikes = manifestUnits(seed.manifest)
  return {
    ...seed,
    totalBikes,
    pieces: totalBikes,
    weightKg: manifestWeightKg(seed.manifest),
    valueUsd: manifestValueUsd(seed.manifest),
    contents: manifestSummary(seed.manifest),
  }
}

const SEEDS: MovementSeed[] = [
  // ── Warehouse → DC transfers (bulk replenishment) ───────────────────
  { id: 'MOV-T2016', trackingNumber: 'ZP-T-9F4A21', leg: 'transfer', status: 'out-for-delivery', priority: 'high', originId: 'WH-LGB', origin: 'Long Beach, CA', originCode: 'LGB', destId: 'DC-LAX', destination: 'Los Angeles, CA', destinationCode: 'LAX', customer: 'Los Angeles DC', customerId: 'DC-LAX', carrier: 'Zepp Linehaul', service: 'freight', manifest: { 'ZB-CITY': 48, 'ZB-LITE': 30, 'ZB-PRO': 18 }, costUsd: 1850, driver: 'Grant Whitaker', vehicle: 'TRK-118', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', progress: 90, lastUpdate: '2026-05-28T14:05:00Z', lastLocation: 'Los Angeles DC — inbound dock' },
  { id: 'MOV-T2015', trackingNumber: 'ZP-T-2C66D3', leg: 'transfer', status: 'in-transit', priority: 'medium', originId: 'WH-LGB', origin: 'Long Beach, CA', originCode: 'LGB', destId: 'DC-SFO', destination: 'San Francisco, CA', destinationCode: 'SFO', customer: 'Bay Area DC', customerId: 'DC-SFO', carrier: 'Pacific Drayage', service: 'freight', manifest: { 'ZB-PRO': 40, 'ZB-FOLD': 22, 'ZB-CITY': 24 }, costUsd: 2100, driver: 'Owen Fischer', vehicle: 'TRK-301', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-29', progress: 58, lastUpdate: '2026-05-28T12:25:00Z', lastLocation: 'Santa Maria, CA — US-101' },
  { id: 'MOV-T2014', trackingNumber: 'ZP-T-8F20B1', leg: 'transfer', status: 'in-transit', priority: 'low', originId: 'WH-LGB', origin: 'Long Beach, CA', originCode: 'LGB', destId: 'DC-SEA', destination: 'Seattle, WA', destinationCode: 'SEA', customer: 'Seattle DC', customerId: 'DC-SEA', carrier: 'Zepp Linehaul', service: 'freight', manifest: { 'ZB-TRAIL': 26, 'ZB-CITY': 30, 'ZB-LITE': 20 }, costUsd: 2600, driver: 'Travis Boone', vehicle: 'TRK-230', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-30', progress: 35, lastUpdate: '2026-05-28T10:05:00Z', lastLocation: 'Redding, CA — I-5 northbound' },
  { id: 'MOV-T2013', trackingNumber: 'ZP-T-4F8A21', leg: 'transfer', status: 'delivered', priority: 'medium', originId: 'WH-LGB', origin: 'Long Beach, CA', originCode: 'LGB', destId: 'DC-PHX', destination: 'Phoenix, AZ', destinationCode: 'PHX', customer: 'Phoenix DC', customerId: 'DC-PHX', carrier: 'Sunbelt Freight', service: 'freight', manifest: { 'ZB-CITY': 36, 'ZB-LITE': 28, 'ZB-CARGO': 12 }, costUsd: 1480, driver: 'Grant Whitaker', vehicle: 'TRK-118', createdDate: '2026-05-24', shipDate: '2026-05-24', estimatedDelivery: '2026-05-26', actualDelivery: '2026-05-26', progress: 100, lastUpdate: '2026-05-26T16:40:00Z', lastLocation: 'Phoenix DC — received' },
  { id: 'MOV-T2012', trackingNumber: 'ZP-T-1A55E0', leg: 'transfer', status: 'delayed', priority: 'high', originId: 'WH-LGB', origin: 'Long Beach, CA', originCode: 'LGB', destId: 'DC-DEN', destination: 'Denver, CO', destinationCode: 'DEN', customer: 'Denver DC', customerId: 'DC-DEN', carrier: 'RoadRunner Logistics', service: 'freight', manifest: { 'ZB-CARGO': 18, 'ZB-PRO': 22, 'ZB-CITY': 20 }, costUsd: 2900, driver: 'Amara Diallo', vehicle: 'TRK-240', createdDate: '2026-05-26', shipDate: '2026-05-26', estimatedDelivery: '2026-05-28', progress: 62, lastUpdate: '2026-05-28T09:05:00Z', lastLocation: 'Grand Junction, CO — weather hold' },
  { id: 'MOV-T2011', trackingNumber: 'ZP-T-9C3D77', leg: 'transfer', status: 'in-transit', priority: 'medium', originId: 'WH-EWR', origin: 'Newark, NJ', originCode: 'EWR', destId: 'DC-JFK', destination: 'New York, NY', destinationCode: 'JFK', customer: 'New York DC', customerId: 'DC-JFK', carrier: 'Metro Courier', service: 'freight', manifest: { 'ZB-FOLD': 30, 'ZB-CITY': 44, 'ZB-PRO': 20 }, costUsd: 940, driver: 'Isabela Cruz', vehicle: 'TRK-214', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', progress: 70, lastUpdate: '2026-05-28T13:20:00Z', lastLocation: 'Jersey City, NJ — Holland Tunnel' },
  { id: 'MOV-T2010', trackingNumber: 'ZP-T-7B92F4', leg: 'transfer', status: 'delivered', priority: 'medium', originId: 'WH-EWR', origin: 'Newark, NJ', originCode: 'EWR', destId: 'DC-BOS', destination: 'Boston, MA', destinationCode: 'BOS', customer: 'Boston DC', customerId: 'DC-BOS', carrier: 'Zepp Linehaul', service: 'freight', manifest: { 'ZB-PRO': 26, 'ZB-CITY': 30, 'ZB-TRAIL': 14 }, costUsd: 1320, driver: 'Carlos Mendez', vehicle: 'TRK-211', createdDate: '2026-05-23', shipDate: '2026-05-23', estimatedDelivery: '2026-05-25', actualDelivery: '2026-05-25', progress: 100, lastUpdate: '2026-05-25T19:08:00Z', lastLocation: 'Boston DC — received' },
  { id: 'MOV-T2009', trackingNumber: 'ZP-T-5E11C8', leg: 'transfer', status: 'delivered', priority: 'low', originId: 'WH-EWR', origin: 'Newark, NJ', originCode: 'EWR', destId: 'DC-ORD', destination: 'Chicago, IL', destinationCode: 'ORD', customer: 'Chicago DC', customerId: 'DC-ORD', carrier: 'RoadRunner Logistics', service: 'freight', manifest: { 'ZB-CITY': 50, 'ZB-LITE': 32, 'ZB-CARGO': 16 }, costUsd: 2150, driver: 'Tasha Okafor', vehicle: 'TRK-208', createdDate: '2026-05-22', shipDate: '2026-05-23', estimatedDelivery: '2026-05-25', actualDelivery: '2026-05-24', progress: 100, lastUpdate: '2026-05-24T17:30:00Z', lastLocation: 'Chicago DC — received' },
  { id: 'MOV-T2008', trackingNumber: 'ZP-T-3D74AA', leg: 'transfer', status: 'pending', priority: 'low', originId: 'WH-EWR', origin: 'Newark, NJ', originCode: 'EWR', destId: 'DC-EWR', destination: 'Newark, NJ', destinationCode: 'EWR', customer: 'Newark City DC', customerId: 'DC-EWR', carrier: 'Metro Courier', service: 'freight', manifest: { 'ZB-CITY': 28, 'ZB-PRO': 18, 'ZB-FOLD': 14 }, costUsd: 420, createdDate: '2026-05-28', shipDate: '2026-05-29', estimatedDelivery: '2026-05-29', progress: 5, lastUpdate: '2026-05-28T08:55:00Z', lastLocation: 'East Coast Import Hub — staged' },
  { id: 'MOV-T2007', trackingNumber: 'ZP-T-8C45F0', leg: 'transfer', status: 'in-transit', priority: 'medium', originId: 'WH-SAV', origin: 'Savannah, GA', originCode: 'SAV', destId: 'DC-ATL', destination: 'Atlanta, GA', destinationCode: 'ATL', customer: 'Atlanta DC', customerId: 'DC-ATL', carrier: 'Sunbelt Freight', service: 'freight', manifest: { 'ZB-TRAIL': 22, 'ZB-CITY': 34, 'ZB-PRO': 18 }, costUsd: 880, driver: 'Tasha Okafor', vehicle: 'TRK-208', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', progress: 48, lastUpdate: '2026-05-28T12:01:00Z', lastLocation: 'Macon, GA — I-75' },
  { id: 'MOV-T2006', trackingNumber: 'ZP-T-9E57D8', leg: 'transfer', status: 'exception', priority: 'high', originId: 'WH-SAV', origin: 'Savannah, GA', originCode: 'SAV', destId: 'DC-MIA', destination: 'Miami, FL', destinationCode: 'MIA', customer: 'Miami DC', customerId: 'DC-MIA', carrier: 'RoadRunner Logistics', service: 'freight', manifest: { 'ZB-CITY': 40, 'ZB-CARGO': 14, 'ZB-LITE': 22 }, costUsd: 1120, driver: 'Greta Lindqvist', vehicle: 'TRK-220', createdDate: '2026-05-25', shipDate: '2026-05-25', estimatedDelivery: '2026-05-27', progress: 50, lastUpdate: '2026-05-28T06:20:00Z', lastLocation: 'Jacksonville, FL — damaged carton flagged' },
  { id: 'MOV-T2005', trackingNumber: 'ZP-T-2D88A1', leg: 'transfer', status: 'pending', priority: 'medium', originId: 'WH-SAV', origin: 'Savannah, GA', originCode: 'SAV', destId: 'DC-DFW', destination: 'Dallas, TX', destinationCode: 'DFW', customer: 'Dallas DC', customerId: 'DC-DFW', carrier: 'Sunbelt Freight', service: 'freight', manifest: { 'ZB-CARGO': 20, 'ZB-CITY': 30, 'ZB-PRO': 16 }, costUsd: 1700, createdDate: '2026-05-28', shipDate: '2026-05-29', estimatedDelivery: '2026-05-31', progress: 5, lastUpdate: '2026-05-28T09:40:00Z', lastLocation: 'Southeast Import Hub — staged' },
  { id: 'MOV-T2004', trackingNumber: 'ZP-T-6A40E9', leg: 'transfer', status: 'delivered', priority: 'low', originId: 'WH-LGB', origin: 'Long Beach, CA', originCode: 'LGB', destId: 'DC-LAX', destination: 'Los Angeles, CA', destinationCode: 'LAX', customer: 'Los Angeles DC', customerId: 'DC-LAX', carrier: 'Zepp Linehaul', service: 'freight', manifest: { 'ZB-CITY': 44, 'ZB-PRO': 22, 'ZB-FOLD': 18 }, costUsd: 720, driver: 'Grant Whitaker', vehicle: 'TRK-118', createdDate: '2026-05-23', shipDate: '2026-05-23', estimatedDelivery: '2026-05-24', actualDelivery: '2026-05-24', progress: 100, lastUpdate: '2026-05-24T14:55:00Z', lastLocation: 'Los Angeles DC — received' },
  { id: 'MOV-T2003', trackingNumber: 'ZP-T-1F73C5', leg: 'transfer', status: 'picked-up', priority: 'low', originId: 'WH-EWR', origin: 'Newark, NJ', originCode: 'EWR', destId: 'DC-ORD', destination: 'Chicago, IL', destinationCode: 'ORD', customer: 'Chicago DC', customerId: 'DC-ORD', carrier: 'RoadRunner Logistics', service: 'freight', manifest: { 'ZB-CITY': 38, 'ZB-LITE': 24, 'ZB-PRO': 20 }, costUsd: 1100, driver: 'Carlos Mendez', vehicle: 'TRK-211', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-30', progress: 20, lastUpdate: '2026-05-28T13:48:00Z', lastLocation: 'East Coast Import Hub — departed' },
  { id: 'MOV-T2002', trackingNumber: 'ZP-T-7E09B8', leg: 'transfer', status: 'delivered', priority: 'medium', originId: 'WH-SAV', origin: 'Savannah, GA', originCode: 'SAV', destId: 'DC-ATL', destination: 'Atlanta, GA', destinationCode: 'ATL', customer: 'Atlanta DC', customerId: 'DC-ATL', carrier: 'Sunbelt Freight', service: 'freight', manifest: { 'ZB-CITY': 46, 'ZB-TRAIL': 16, 'ZB-CARGO': 14 }, costUsd: 1240, driver: 'Travis Boone', vehicle: 'TRK-230', createdDate: '2026-05-21', shipDate: '2026-05-21', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-23', progress: 100, lastUpdate: '2026-05-23T17:30:00Z', lastLocation: 'Atlanta DC — received' },
  { id: 'MOV-T2001', trackingNumber: 'ZP-T-4B88F2', leg: 'transfer', status: 'in-transit', priority: 'medium', originId: 'WH-LGB', origin: 'Long Beach, CA', originCode: 'LGB', destId: 'DC-DEN', destination: 'Denver, CO', destinationCode: 'DEN', customer: 'Denver DC', customerId: 'DC-DEN', carrier: 'RoadRunner Logistics', service: 'freight', manifest: { 'ZB-CARGO': 16, 'ZB-CITY': 28, 'ZB-LITE': 18 }, costUsd: 1850, driver: 'Roy Schaefer', vehicle: 'TRK-118B', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-29', progress: 52, lastUpdate: '2026-05-28T11:50:00Z', lastLocation: 'Green River, UT — I-70' },

  // ── DC → consumer last-mile deliveries ──────────────────────────────
  { id: 'MOV-L4101', trackingNumber: 'ZP-2026-4F8A21', leg: 'last-mile', status: 'out-for-delivery', priority: 'high', originId: 'DC-LAX', origin: 'Los Angeles DC', originCode: 'LAX', destId: 'CON-001', destination: 'Los Angeles, CA', destinationCode: 'LAX', customer: 'Daniel Reyes', customerId: 'CON-001', consumerId: 'CON-001', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-CITY': 1 }, costUsd: 48, driver: 'Marcus Bell', vehicle: 'VAN-114', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', progress: 90, lastUpdate: '2026-05-28T14:05:00Z', lastLocation: 'Mid-Wilshire — last mile' },
  { id: 'MOV-L4102', trackingNumber: 'ZP-2026-9C3D77', leg: 'last-mile', status: 'in-transit', priority: 'medium', originId: 'DC-SFO', origin: 'Bay Area DC', originCode: 'SFO', destId: 'CON-002', destination: 'San Francisco, CA', destinationCode: 'SFO', customer: 'Emily Carter', customerId: 'CON-002', consumerId: 'CON-002', carrier: 'Metro Courier', service: 'express', manifest: { 'ZB-PRO': 1 }, costUsd: 62, driver: 'Leah Park', vehicle: 'VAN-121', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', progress: 55, lastUpdate: '2026-05-28T11:42:00Z', lastLocation: 'Daly City, CA' },
  { id: 'MOV-L4103', trackingNumber: 'ZP-2026-1A55E0', leg: 'last-mile', status: 'delayed', priority: 'high', originId: 'DC-SEA', origin: 'Seattle DC', originCode: 'SEA', destId: 'CON-003', destination: 'Seattle, WA', destinationCode: 'SEA', customer: 'Nathan Brooks', customerId: 'CON-003', consumerId: 'CON-003', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-TRAIL': 1 }, costUsd: 70, driver: 'Ruby Vance', vehicle: 'VAN-155', createdDate: '2026-05-26', shipDate: '2026-05-27', estimatedDelivery: '2026-05-28', progress: 48, lastUpdate: '2026-05-28T13:20:00Z', lastLocation: 'Tacoma, WA — traffic hold' },
  { id: 'MOV-L4104', trackingNumber: 'ZP-2026-7B92F4', leg: 'last-mile', status: 'delivered', priority: 'medium', originId: 'DC-PHX', origin: 'Phoenix DC', originCode: 'PHX', destId: 'CON-004', destination: 'Phoenix, AZ', destinationCode: 'PHX', customer: 'Olivia Hayes', customerId: 'CON-004', consumerId: 'CON-004', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-LITE': 1 }, costUsd: 45, driver: 'Noah Brennan', vehicle: 'VAN-150', createdDate: '2026-05-24', shipDate: '2026-05-25', estimatedDelivery: '2026-05-26', actualDelivery: '2026-05-26', progress: 100, lastUpdate: '2026-05-26T19:08:00Z', lastLocation: 'Phoenix — delivered' },
  { id: 'MOV-L4105', trackingNumber: 'ZP-2026-5E11C8', leg: 'last-mile', status: 'exception', priority: 'high', originId: 'DC-DEN', origin: 'Denver DC', originCode: 'DEN', destId: 'CON-005', destination: 'Denver, CO', destinationCode: 'DEN', customer: 'Ryan Mitchell', customerId: 'CON-005', consumerId: 'CON-005', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-CARGO': 1 }, costUsd: 88, driver: 'Eli Donovan', vehicle: 'VAN-140', createdDate: '2026-05-23', shipDate: '2026-05-24', estimatedDelivery: '2026-05-27', progress: 42, lastUpdate: '2026-05-28T08:15:00Z', lastLocation: 'Aurora, CO — address unverified' },
  { id: 'MOV-L4106', trackingNumber: 'ZP-2026-3D74AA', leg: 'last-mile', status: 'delivered', priority: 'medium', originId: 'DC-JFK', origin: 'New York DC', originCode: 'JFK', destId: 'CON-006', destination: 'New York, NY', destinationCode: 'JFK', customer: 'Sophia Bennett', customerId: 'CON-006', consumerId: 'CON-006', carrier: 'Metro Courier', service: 'express', manifest: { 'ZB-FOLD': 1 }, costUsd: 56, driver: 'Caleb Ortiz', vehicle: 'VAN-105', createdDate: '2026-05-22', shipDate: '2026-05-23', estimatedDelivery: '2026-05-24', actualDelivery: '2026-05-24', progress: 100, lastUpdate: '2026-05-24T16:40:00Z', lastLocation: 'Manhattan — delivered' },
  { id: 'MOV-L4107', trackingNumber: 'ZP-2026-8F20B1', leg: 'last-mile', status: 'in-transit', priority: 'low', originId: 'DC-BOS', origin: 'Boston DC', originCode: 'BOS', destId: 'CON-007', destination: 'Boston, MA', destinationCode: 'BOS', customer: 'Ethan Sullivan', customerId: 'CON-007', consumerId: 'CON-007', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-PRO': 1 }, costUsd: 60, driver: 'Devin Walsh', vehicle: 'VAN-102', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', progress: 35, lastUpdate: '2026-05-28T10:05:00Z', lastLocation: 'Cambridge, MA' },
  { id: 'MOV-L4108', trackingNumber: 'ZP-2026-2C66D3', leg: 'last-mile', status: 'pending', priority: 'high', originId: 'DC-ORD', origin: 'Chicago DC', originCode: 'ORD', destId: 'CON-008', destination: 'Chicago, IL', destinationCode: 'ORD', customer: 'Grace Coleman', customerId: 'CON-008', consumerId: 'CON-008', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-CITY': 1 }, costUsd: 50, createdDate: '2026-05-28', shipDate: '2026-05-29', estimatedDelivery: '2026-05-29', progress: 5, lastUpdate: '2026-05-28T12:30:00Z', lastLocation: 'Chicago DC — pick queue' },
  { id: 'MOV-L4109', trackingNumber: 'ZP-2026-6A40E9', leg: 'last-mile', status: 'delivered', priority: 'critical', originId: 'DC-EWR', origin: 'Newark City DC', originCode: 'EWR', destId: 'CON-009', destination: 'Newark, NJ', destinationCode: 'EWR', customer: 'Lucas Foster', customerId: 'CON-009', consumerId: 'CON-009', carrier: 'Metro Courier', service: 'overnight', manifest: { 'ZB-LITE': 1 }, costUsd: 44, driver: 'Caleb Ortiz', vehicle: 'VAN-105', createdDate: '2026-05-25', shipDate: '2026-05-26', estimatedDelivery: '2026-05-26', actualDelivery: '2026-05-26', progress: 100, lastUpdate: '2026-05-26T09:12:00Z', lastLocation: 'Newark — delivered' },
  { id: 'MOV-L4110', trackingNumber: 'ZP-2026-4B88F2', leg: 'last-mile', status: 'in-transit', priority: 'medium', originId: 'DC-ATL', origin: 'Atlanta DC', originCode: 'ATL', destId: 'CON-010', destination: 'Atlanta, GA', destinationCode: 'ATL', customer: 'Chloe Morgan', customerId: 'CON-010', consumerId: 'CON-010', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-TRAIL': 1 }, costUsd: 72, driver: 'Hannah Cole', vehicle: 'VAN-119', createdDate: '2026-05-26', shipDate: '2026-05-27', estimatedDelivery: '2026-05-29', progress: 62, lastUpdate: '2026-05-28T12:01:00Z', lastLocation: 'Decatur, GA' },
  { id: 'MOV-L4111', trackingNumber: 'ZP-2026-9D12A7', leg: 'last-mile', status: 'delivered', priority: 'high', originId: 'DC-MIA', origin: 'Miami DC', originCode: 'MIA', destId: 'CON-011', destination: 'Miami, FL', destinationCode: 'MIA', customer: 'Mason Rivera', customerId: 'CON-011', consumerId: 'CON-011', carrier: 'Metro Courier', service: 'express', manifest: { 'ZB-CITY': 1 }, costUsd: 52, driver: 'Hannah Cole', vehicle: 'VAN-119', createdDate: '2026-05-23', shipDate: '2026-05-23', estimatedDelivery: '2026-05-24', actualDelivery: '2026-05-24', progress: 100, lastUpdate: '2026-05-24T14:55:00Z', lastLocation: 'Miami — delivered' },
  { id: 'MOV-L4112', trackingNumber: 'ZP-2026-1F73C5', leg: 'last-mile', status: 'out-for-delivery', priority: 'medium', originId: 'DC-DFW', origin: 'Dallas DC', originCode: 'DFW', destId: 'CON-012', destination: 'Dallas, TX', destinationCode: 'DFW', customer: 'Ava Richardson', customerId: 'CON-012', consumerId: 'CON-012', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-CARGO': 1 }, costUsd: 85, driver: 'Caleb Ortiz', vehicle: 'VAN-105', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', progress: 88, lastUpdate: '2026-05-28T13:55:00Z', lastLocation: 'Irving, TX — last mile' },
  { id: 'MOV-L4113', trackingNumber: 'ZP-2026-7E09B8', leg: 'last-mile', status: 'delivered', priority: 'medium', originId: 'DC-LAX', origin: 'Los Angeles DC', originCode: 'LAX', destId: 'CON-013', destination: 'Los Angeles, CA', destinationCode: 'LAX', customer: 'Henry Parker', customerId: 'CON-013', consumerId: 'CON-013', carrier: 'Metro Courier', service: 'express', manifest: { 'ZB-PRO': 1 }, costUsd: 58, driver: 'Marcus Bell', vehicle: 'VAN-114', createdDate: '2026-05-21', shipDate: '2026-05-22', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-23', progress: 100, lastUpdate: '2026-05-23T17:30:00Z', lastLocation: 'Los Angeles — delivered' },
  { id: 'MOV-L4114', trackingNumber: 'ZP-2026-3A61D4', leg: 'last-mile', status: 'in-transit', priority: 'high', originId: 'DC-SFO', origin: 'Bay Area DC', originCode: 'SFO', destId: 'CON-014', destination: 'San Jose, CA', destinationCode: 'SFO', customer: 'Isla Murphy', customerId: 'CON-014', consumerId: 'CON-014', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-CITY': 1 }, costUsd: 54, driver: 'Maya Sullivan', vehicle: 'VAN-130', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', progress: 28, lastUpdate: '2026-05-28T12:25:00Z', lastLocation: 'Sunnyvale, CA' },
  { id: 'MOV-L4115', trackingNumber: 'ZP-2026-8C45F0', leg: 'last-mile', status: 'delivered', priority: 'medium', originId: 'DC-JFK', origin: 'New York DC', originCode: 'JFK', destId: 'CON-015', destination: 'New York, NY', destinationCode: 'JFK', customer: 'Owen Clarke', customerId: 'CON-015', consumerId: 'CON-015', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-TRAIL': 1 }, costUsd: 70, driver: 'Caleb Ortiz', vehicle: 'VAN-105', createdDate: '2026-05-20', shipDate: '2026-05-21', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-22', progress: 100, lastUpdate: '2026-05-22T16:00:00Z', lastLocation: 'Brooklyn — delivered' },
  { id: 'MOV-L4116', trackingNumber: 'ZP-2026-2B86F7', leg: 'last-mile', status: 'out-for-delivery', priority: 'high', originId: 'DC-ORD', origin: 'Chicago DC', originCode: 'ORD', destId: 'CON-016', destination: 'Chicago, IL', destinationCode: 'ORD', customer: 'Mia Thompson', customerId: 'CON-016', consumerId: 'CON-016', carrier: 'Metro Courier', service: 'express', manifest: { 'ZB-PRO': 1 }, costUsd: 60, driver: 'Noah Brennan', vehicle: 'VAN-150', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', progress: 92, lastUpdate: '2026-05-28T13:55:00Z', lastLocation: 'Lincoln Park — last mile' },
  { id: 'MOV-L4117', trackingNumber: 'ZP-2026-6C48A2', leg: 'last-mile', status: 'delivered', priority: 'low', originId: 'DC-LAX', origin: 'Los Angeles DC', originCode: 'LAX', destId: 'CON-001', destination: 'Los Angeles, CA', destinationCode: 'LAX', customer: 'Daniel Reyes', customerId: 'CON-001', consumerId: 'CON-001', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-LITE': 1 }, costUsd: 45, driver: 'Marcus Bell', vehicle: 'VAN-114', createdDate: '2026-05-18', shipDate: '2026-05-19', estimatedDelivery: '2026-05-21', actualDelivery: '2026-05-21', progress: 100, lastUpdate: '2026-05-21T18:45:00Z', lastLocation: 'Los Angeles — delivered' },
  { id: 'MOV-L4118', trackingNumber: 'ZP-2026-9E45C8', leg: 'last-mile', status: 'delivered', priority: 'medium', originId: 'DC-SFO', origin: 'Bay Area DC', originCode: 'SFO', destId: 'CON-002', destination: 'San Francisco, CA', destinationCode: 'SFO', customer: 'Emily Carter', customerId: 'CON-002', consumerId: 'CON-002', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-FOLD': 1 }, costUsd: 56, driver: 'Leah Park', vehicle: 'VAN-121', createdDate: '2026-05-16', shipDate: '2026-05-17', estimatedDelivery: '2026-05-20', actualDelivery: '2026-05-19', progress: 100, lastUpdate: '2026-05-19T14:20:00Z', lastLocation: 'San Francisco — delivered' },
  { id: 'MOV-L4119', trackingNumber: 'ZP-2026-3C29E7', leg: 'last-mile', status: 'pending', priority: 'medium', originId: 'DC-JFK', origin: 'New York DC', originCode: 'JFK', destId: 'CON-006', destination: 'New York, NY', destinationCode: 'JFK', customer: 'Sophia Bennett', customerId: 'CON-006', consumerId: 'CON-006', carrier: 'Metro Courier', service: 'standard', manifest: { 'ZB-CITY': 1 }, costUsd: 50, createdDate: '2026-05-28', shipDate: '2026-05-29', estimatedDelivery: '2026-05-30', progress: 5, lastUpdate: '2026-05-28T10:15:00Z', lastLocation: 'New York DC — pick queue' },
  { id: 'MOV-L4120', trackingNumber: 'ZP-2026-8A53B4', leg: 'last-mile', status: 'delivered', priority: 'high', originId: 'DC-LAX', origin: 'Los Angeles DC', originCode: 'LAX', destId: 'CON-013', destination: 'Los Angeles, CA', destinationCode: 'LAX', customer: 'Henry Parker', customerId: 'CON-013', consumerId: 'CON-013', carrier: 'Metro Courier', service: 'express', manifest: { 'ZB-TRAIL': 1 }, costUsd: 72, driver: 'Marcus Bell', vehicle: 'VAN-114', createdDate: '2026-05-15', shipDate: '2026-05-16', estimatedDelivery: '2026-05-18', actualDelivery: '2026-05-18', progress: 100, lastUpdate: '2026-05-18T13:40:00Z', lastLocation: 'Los Angeles — delivered' },
]

export const MOVEMENTS: Movement[] = SEEDS.map(build)

export function findMovement(id: string): Movement | undefined {
  return MOVEMENTS.find((m) => m.id === id || m.trackingNumber === id)
}

/** Active = anything still moving through the network. */
export function isActive(m: Movement): boolean {
  return !['delivered', 'returned'].includes(m.status)
}

export function isException(m: Movement): boolean {
  return m.status === 'exception' || m.status === 'delayed'
}

export const transfers = (): Movement[] => MOVEMENTS.filter((m) => m.leg === 'transfer')
export const lastMile = (): Movement[] => MOVEMENTS.filter((m) => m.leg === 'last-mile')
