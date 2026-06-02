/**
 * Mock shipment ledger. Hand-built (no Math.random / no Date.now() at
 * module scope) so SSR and client render the exact same strings.
 *
 * The demo "now" is anchored to TODAY below. Dates are chosen so the
 * board shows a believable spread: delivered last week, in-transit today,
 * a couple delayed / exception rows that need attention, and fresh
 * pending pickups. Real consumers swap the array for `useFetch('/api/…')`;
 * the type + helper surface stay identical.
 */

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

export interface Shipment {
  id: string
  trackingNumber: string
  status: ShipmentStatus
  customer: string
  customerId: string
  carrier: string
  service: ServiceLevel
  priority: Priority
  origin: string
  originCode: string
  destination: string
  destinationCode: string
  weightKg: number
  pieces: number
  contents: string
  createdDate: string // ISO yyyy-mm-dd
  shipDate: string
  estimatedDelivery: string
  actualDelivery?: string
  driver?: string
  vehicle?: string
  route?: string
  progress: number // 0-100
  valueUsd: number
  costUsd: number
  lastUpdate: string // ISO datetime, UTC
  lastLocation: string
}

export const CARRIERS = [
  'ShipTrack Fleet',
  'Falcon Freight',
  'RoadRunner Logistics',
  'BlueWave Carriers',
  'Apex Cargo',
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

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: 'Pending pickup',
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
  freight: 'Freight',
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

export const SHIPMENTS: Shipment[] = [
  { id: 'SHP-100412', trackingNumber: 'ST-2026-4F8A21', status: 'out-for-delivery', customer: 'Meridian Electronics', customerId: 'CUS-002', carrier: 'ShipTrack Fleet', service: 'express', priority: 'high', origin: 'Los Angeles, CA', originCode: 'LAX', destination: 'Phoenix, AZ', destinationCode: 'PHX', weightKg: 84, pieces: 6, contents: 'Consumer electronics', createdDate: '2026-05-26', shipDate: '2026-05-26', estimatedDelivery: '2026-05-28', driver: 'Marcus Bell', vehicle: 'VAN-114', route: 'RTE-LA-PHX', progress: 90, valueUsd: 42500, costUsd: 680, lastUpdate: '2026-05-28T14:05:00Z', lastLocation: 'Phoenix sortation hub' },
  { id: 'SHP-100408', trackingNumber: 'ST-2026-9C3D77', status: 'in-transit', customer: 'Nordwind Retail Group', customerId: 'CUS-001', carrier: 'Falcon Freight', service: 'standard', priority: 'medium', origin: 'Chicago, IL', originCode: 'ORD', destination: 'Denver, CO', destinationCode: 'DEN', weightKg: 1240, pieces: 22, contents: 'Retail apparel pallets', createdDate: '2026-05-25', shipDate: '2026-05-26', estimatedDelivery: '2026-05-30', driver: 'Tasha Okafor', vehicle: 'TRK-208', route: 'RTE-CHI-DEN', progress: 55, valueUsd: 96000, costUsd: 2150, lastUpdate: '2026-05-28T11:42:00Z', lastLocation: 'Lincoln, NE — I-80 corridor' },
  { id: 'SHP-100401', trackingNumber: 'ST-2026-1A55E0', status: 'delayed', customer: 'Atlas Pharma', customerId: 'CUS-004', carrier: 'ShipTrack Fleet', service: 'overnight', priority: 'critical', origin: 'Boston, MA', originCode: 'BOS', destination: 'New York, NY', destinationCode: 'JFK', weightKg: 38, pieces: 3, contents: 'Temperature-controlled pharma', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-28', driver: 'Devin Walsh', vehicle: 'VAN-102', route: 'RTE-BOS-NYC', progress: 48, valueUsd: 128000, costUsd: 940, lastUpdate: '2026-05-28T13:20:00Z', lastLocation: 'Hartford, CT — weather hold' },
  { id: 'SHP-100395', trackingNumber: 'ST-2026-7B92F4', status: 'delivered', customer: 'Sunbelt Grocers', customerId: 'CUS-003', carrier: 'RoadRunner Logistics', service: 'standard', priority: 'medium', origin: 'Dallas, TX', originCode: 'DFW', destination: 'Houston, TX', destinationCode: 'IAH', weightKg: 2100, pieces: 30, contents: 'Dry goods pallets', createdDate: '2026-05-23', shipDate: '2026-05-23', estimatedDelivery: '2026-05-25', actualDelivery: '2026-05-25', driver: 'Carlos Mendez', vehicle: 'TRK-211', route: 'RTE-DFW-IAH', progress: 100, valueUsd: 54000, costUsd: 1320, lastUpdate: '2026-05-25T19:08:00Z', lastLocation: 'Houston DC — delivered' },
  { id: 'SHP-100390', trackingNumber: 'ST-2026-5E11C8', status: 'exception', customer: 'Vertex Auto Parts', customerId: 'CUS-005', carrier: 'BlueWave Carriers', service: 'freight', priority: 'high', origin: 'Detroit, MI', originCode: 'DTW', destination: 'Atlanta, GA', destinationCode: 'ATL', weightKg: 5400, pieces: 48, contents: 'Automotive components', createdDate: '2026-05-22', shipDate: '2026-05-23', estimatedDelivery: '2026-05-27', driver: 'Priya Nair', vehicle: 'TRK-305', route: 'RTE-DTW-ATL', progress: 42, valueUsd: 187000, costUsd: 3400, lastUpdate: '2026-05-28T08:15:00Z', lastLocation: 'Nashville, TN — held for inspection' },
  { id: 'SHP-100388', trackingNumber: 'ST-2026-3D74AA', status: 'delivered', customer: 'Coastal Apparel Co.', customerId: 'CUS-006', carrier: 'ShipTrack Fleet', service: 'express', priority: 'medium', origin: 'Miami, FL', originCode: 'MIA', destination: 'Atlanta, GA', destinationCode: 'ATL', weightKg: 220, pieces: 12, contents: 'Seasonal apparel', createdDate: '2026-05-22', shipDate: '2026-05-22', estimatedDelivery: '2026-05-24', actualDelivery: '2026-05-24', driver: 'Hannah Cole', vehicle: 'VAN-119', route: 'RTE-MIA-ATL', progress: 100, valueUsd: 31000, costUsd: 560, lastUpdate: '2026-05-24T16:40:00Z', lastLocation: 'Atlanta — delivered' },
  { id: 'SHP-100385', trackingNumber: 'ST-2026-8F20B1', status: 'in-transit', customer: 'Granite Construction Supply', customerId: 'CUS-007', carrier: 'Apex Cargo', service: 'freight', priority: 'low', origin: 'Seattle, WA', originCode: 'SEA', destination: 'Portland, OR', destinationCode: 'PDX', weightKg: 8800, pieces: 60, contents: 'Construction materials', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-29', driver: 'Owen Fischer', vehicle: 'TRK-301', route: 'RTE-SEA-PDX', progress: 35, valueUsd: 72000, costUsd: 2600, lastUpdate: '2026-05-28T10:05:00Z', lastLocation: 'Olympia, WA — I-5 southbound' },
  { id: 'SHP-100379', trackingNumber: 'ST-2026-2C66D3', status: 'pending', customer: 'BlueLeaf Organics', customerId: 'CUS-008', carrier: 'ShipTrack Fleet', service: 'same-day', priority: 'high', origin: 'San Francisco, CA', originCode: 'SFO', destination: 'San Francisco, CA', destinationCode: 'SFO', weightKg: 46, pieces: 8, contents: 'Refrigerated produce', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', progress: 5, valueUsd: 8400, costUsd: 180, lastUpdate: '2026-05-28T12:30:00Z', lastLocation: 'SFO pickup queue' },
  { id: 'SHP-100376', trackingNumber: 'ST-2026-6A40E9', status: 'delivered', customer: 'Pinnacle Medical', customerId: 'CUS-009', carrier: 'ShipTrack Fleet', service: 'overnight', priority: 'critical', origin: 'New York, NY', originCode: 'JFK', destination: 'Boston, MA', destinationCode: 'BOS', weightKg: 28, pieces: 2, contents: 'Medical devices', createdDate: '2026-05-24', shipDate: '2026-05-24', estimatedDelivery: '2026-05-25', actualDelivery: '2026-05-25', driver: 'Devin Walsh', vehicle: 'VAN-102', route: 'RTE-NYC-BOS', progress: 100, valueUsd: 96000, costUsd: 720, lastUpdate: '2026-05-25T09:12:00Z', lastLocation: 'Boston — delivered' },
  { id: 'SHP-100372', trackingNumber: 'ST-2026-4B88F2', status: 'in-transit', customer: 'Horizon Furniture', customerId: 'CUS-010', carrier: 'Falcon Freight', service: 'freight', priority: 'medium', origin: 'Kansas City, MO', originCode: 'MCI', destination: 'Minneapolis, MN', destinationCode: 'MSP', weightKg: 3600, pieces: 18, contents: 'Flat-pack furniture', createdDate: '2026-05-26', shipDate: '2026-05-27', estimatedDelivery: '2026-05-29', driver: 'Greta Lindqvist', vehicle: 'TRK-220', route: 'RTE-MCI-MSP', progress: 62, valueUsd: 64000, costUsd: 1850, lastUpdate: '2026-05-28T12:01:00Z', lastLocation: 'Des Moines, IA' },
  { id: 'SHP-100369', trackingNumber: 'ST-2026-9D12A7', status: 'delivered', customer: 'Quantum Components', customerId: 'CUS-011', carrier: 'ShipTrack Fleet', service: 'express', priority: 'high', origin: 'Phoenix, AZ', originCode: 'PHX', destination: 'Los Angeles, CA', destinationCode: 'LAX', weightKg: 110, pieces: 9, contents: 'Semiconductor trays', createdDate: '2026-05-23', shipDate: '2026-05-23', estimatedDelivery: '2026-05-24', actualDelivery: '2026-05-24', driver: 'Marcus Bell', vehicle: 'VAN-114', route: 'RTE-PHX-LA', progress: 100, valueUsd: 215000, costUsd: 640, lastUpdate: '2026-05-24T14:55:00Z', lastLocation: 'Los Angeles — delivered' },
  { id: 'SHP-100364', trackingNumber: 'ST-2026-1F73C5', status: 'picked-up', customer: 'Evergreen Foods', customerId: 'CUS-012', carrier: 'RoadRunner Logistics', service: 'standard', priority: 'low', origin: 'Portland, OR', originCode: 'PDX', destination: 'Seattle, WA', destinationCode: 'SEA', weightKg: 1800, pieces: 24, contents: 'Packaged foods', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-30', driver: 'Owen Fischer', vehicle: 'TRK-301', route: 'RTE-SEA-PDX', progress: 20, valueUsd: 38000, costUsd: 1100, lastUpdate: '2026-05-28T13:48:00Z', lastLocation: 'Portland origin DC' },
  { id: 'SHP-100358', trackingNumber: 'ST-2026-7E09B8', status: 'delivered', customer: 'Nordwind Retail Group', customerId: 'CUS-001', carrier: 'ShipTrack Fleet', service: 'standard', priority: 'medium', origin: 'Chicago, IL', originCode: 'ORD', destination: 'Kansas City, MO', destinationCode: 'MCI', weightKg: 940, pieces: 15, contents: 'Retail home goods', createdDate: '2026-05-21', shipDate: '2026-05-21', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-23', driver: 'Tasha Okafor', vehicle: 'TRK-208', route: 'RTE-CHI-MCI', progress: 100, valueUsd: 47000, costUsd: 1240, lastUpdate: '2026-05-23T17:30:00Z', lastLocation: 'Kansas City — delivered' },
  { id: 'SHP-100351', trackingNumber: 'ST-2026-3A61D4', status: 'in-transit', customer: 'Meridian Electronics', customerId: 'CUS-002', carrier: 'BlueWave Carriers', service: 'express', priority: 'high', origin: 'New York, NY', originCode: 'JFK', destination: 'Chicago, IL', destinationCode: 'ORD', weightKg: 320, pieces: 14, contents: 'Networking hardware', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-29', driver: 'Isabela Cruz', vehicle: 'TRK-214', route: 'RTE-NYC-CHI', progress: 58, valueUsd: 132000, costUsd: 980, lastUpdate: '2026-05-28T12:25:00Z', lastLocation: 'Cleveland, OH' },
  { id: 'SHP-100347', trackingNumber: 'ST-2026-8C45F0', status: 'returned', customer: 'Coastal Apparel Co.', customerId: 'CUS-006', carrier: 'Falcon Freight', service: 'standard', priority: 'low', origin: 'Atlanta, GA', originCode: 'ATL', destination: 'Miami, FL', destinationCode: 'MIA', weightKg: 180, pieces: 10, contents: 'Returned apparel', createdDate: '2026-05-20', shipDate: '2026-05-20', estimatedDelivery: '2026-05-22', actualDelivery: '2026-05-26', driver: 'Hannah Cole', vehicle: 'VAN-119', route: 'RTE-MIA-ATL', progress: 100, valueUsd: 12000, costUsd: 480, lastUpdate: '2026-05-26T15:10:00Z', lastLocation: 'Atlanta returns dock' },
  { id: 'SHP-100342', trackingNumber: 'ST-2026-2D88A1', status: 'out-for-delivery', customer: 'Atlas Pharma', customerId: 'CUS-004', carrier: 'ShipTrack Fleet', service: 'overnight', priority: 'critical', origin: 'Newark, NJ', originCode: 'EWR', destination: 'New York, NY', destinationCode: 'JFK', weightKg: 22, pieces: 2, contents: 'Cold-chain vaccines', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-28', driver: 'Devin Walsh', vehicle: 'VAN-102', route: 'RTE-BOS-NYC', progress: 92, valueUsd: 210000, costUsd: 1050, lastUpdate: '2026-05-28T13:55:00Z', lastLocation: 'Manhattan — last mile' },
  { id: 'SHP-100338', trackingNumber: 'ST-2026-6B27E3', status: 'in-transit', customer: 'Sunbelt Grocers', customerId: 'CUS-003', carrier: 'Apex Cargo', service: 'freight', priority: 'medium', origin: 'Houston, TX', originCode: 'IAH', destination: 'Dallas, TX', destinationCode: 'DFW', weightKg: 4200, pieces: 36, contents: 'Beverage pallets', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', driver: 'Carlos Mendez', vehicle: 'TRK-211', route: 'RTE-DFW-IAH', progress: 30, valueUsd: 58000, costUsd: 1700, lastUpdate: '2026-05-28T11:15:00Z', lastLocation: 'Huntsville, TX' },
  { id: 'SHP-100333', trackingNumber: 'ST-2026-9A54C7', status: 'delivered', customer: 'BlueLeaf Organics', customerId: 'CUS-008', carrier: 'ShipTrack Fleet', service: 'same-day', priority: 'high', origin: 'San Francisco, CA', originCode: 'SFO', destination: 'San Jose, CA', destinationCode: 'SJC', weightKg: 60, pieces: 11, contents: 'Organic produce', createdDate: '2026-05-26', shipDate: '2026-05-26', estimatedDelivery: '2026-05-26', actualDelivery: '2026-05-26', driver: 'Leah Park', vehicle: 'VAN-121', route: 'RTE-SFO-SJC', progress: 100, valueUsd: 9200, costUsd: 210, lastUpdate: '2026-05-26T18:20:00Z', lastLocation: 'San Jose — delivered' },
  { id: 'SHP-100327', trackingNumber: 'ST-2026-4E63B9', status: 'pending', customer: 'Granite Construction Supply', customerId: 'CUS-007', carrier: 'BlueWave Carriers', service: 'freight', priority: 'low', origin: 'Denver, CO', originCode: 'DEN', destination: 'Phoenix, AZ', destinationCode: 'PHX', weightKg: 7200, pieces: 52, contents: 'Steel framing', createdDate: '2026-05-28', shipDate: '2026-05-29', estimatedDelivery: '2026-06-01', progress: 5, valueUsd: 88000, costUsd: 2900, lastUpdate: '2026-05-28T09:40:00Z', lastLocation: 'Denver origin terminal' },
  { id: 'SHP-100322', trackingNumber: 'ST-2026-1C90D6', status: 'delayed', customer: 'Horizon Furniture', customerId: 'CUS-010', carrier: 'RoadRunner Logistics', service: 'standard', priority: 'medium', origin: 'Minneapolis, MN', originCode: 'MSP', destination: 'Chicago, IL', destinationCode: 'ORD', weightKg: 2900, pieces: 16, contents: 'Office furniture', createdDate: '2026-05-25', shipDate: '2026-05-25', estimatedDelivery: '2026-05-27', driver: 'Greta Lindqvist', vehicle: 'TRK-220', route: 'RTE-MCI-MSP', progress: 70, valueUsd: 51000, costUsd: 1480, lastUpdate: '2026-05-28T07:50:00Z', lastLocation: 'Madison, WI — mechanical delay' },
  { id: 'SHP-100316', trackingNumber: 'ST-2026-7D31A8', status: 'delivered', customer: 'Quantum Components', customerId: 'CUS-011', carrier: 'ShipTrack Fleet', service: 'express', priority: 'high', origin: 'Los Angeles, CA', originCode: 'LAX', destination: 'San Francisco, CA', destinationCode: 'SFO', weightKg: 95, pieces: 7, contents: 'Precision instruments', createdDate: '2026-05-22', shipDate: '2026-05-22', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-23', driver: 'Leah Park', vehicle: 'VAN-121', route: 'RTE-LA-SFO', progress: 100, valueUsd: 178000, costUsd: 720, lastUpdate: '2026-05-23T13:05:00Z', lastLocation: 'San Francisco — delivered' },
  { id: 'SHP-100309', trackingNumber: 'ST-2026-3F72E1', status: 'in-transit', customer: 'Evergreen Foods', customerId: 'CUS-012', carrier: 'Falcon Freight', service: 'freight', priority: 'low', origin: 'Atlanta, GA', originCode: 'ATL', destination: 'Miami, FL', destinationCode: 'MIA', weightKg: 5100, pieces: 40, contents: 'Canned goods', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-30', driver: 'Hannah Cole', vehicle: 'TRK-230', route: 'RTE-MIA-ATL', progress: 45, valueUsd: 43000, costUsd: 1900, lastUpdate: '2026-05-28T10:30:00Z', lastLocation: 'Gainesville, FL' },
  { id: 'SHP-100302', trackingNumber: 'ST-2026-8A19C4', status: 'delivered', customer: 'Vertex Auto Parts', customerId: 'CUS-005', carrier: 'ShipTrack Fleet', service: 'standard', priority: 'medium', origin: 'Chicago, IL', originCode: 'ORD', destination: 'Detroit, MI', destinationCode: 'DTW', weightKg: 1600, pieces: 20, contents: 'Brake assemblies', createdDate: '2026-05-20', shipDate: '2026-05-20', estimatedDelivery: '2026-05-22', actualDelivery: '2026-05-22', driver: 'Isabela Cruz', vehicle: 'TRK-214', route: 'RTE-NYC-CHI', progress: 100, valueUsd: 67000, costUsd: 1380, lastUpdate: '2026-05-22T16:00:00Z', lastLocation: 'Detroit — delivered' },
  { id: 'SHP-100298', trackingNumber: 'ST-2026-2B86F7', status: 'in-transit', customer: 'Pinnacle Medical', customerId: 'CUS-009', carrier: 'ShipTrack Fleet', service: 'express', priority: 'high', origin: 'Boston, MA', originCode: 'BOS', destination: 'Newark, NJ', destinationCode: 'EWR', weightKg: 130, pieces: 8, contents: 'Surgical supplies', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', driver: 'Devin Walsh', vehicle: 'VAN-105', route: 'RTE-BOS-NYC', progress: 40, valueUsd: 88000, costUsd: 760, lastUpdate: '2026-05-28T12:40:00Z', lastLocation: 'Providence, RI' },
  { id: 'SHP-100291', trackingNumber: 'ST-2026-6C48A2', status: 'delivered', customer: 'Nordwind Retail Group', customerId: 'CUS-001', carrier: 'Apex Cargo', service: 'freight', priority: 'low', origin: 'Dallas, TX', originCode: 'DFW', destination: 'Denver, CO', destinationCode: 'DEN', weightKg: 6300, pieces: 44, contents: 'Retail fixtures', createdDate: '2026-05-19', shipDate: '2026-05-20', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-23', driver: 'Tasha Okafor', vehicle: 'TRK-208', route: 'RTE-CHI-DEN', progress: 100, valueUsd: 79000, costUsd: 2550, lastUpdate: '2026-05-23T18:45:00Z', lastLocation: 'Denver — delivered' },
  { id: 'SHP-100284', trackingNumber: 'ST-2026-9E57D8', status: 'exception', customer: 'Meridian Electronics', customerId: 'CUS-002', carrier: 'RoadRunner Logistics', service: 'express', priority: 'high', origin: 'Seattle, WA', originCode: 'SEA', destination: 'Denver, CO', destinationCode: 'DEN', weightKg: 260, pieces: 13, contents: 'Display panels', createdDate: '2026-05-24', shipDate: '2026-05-24', estimatedDelivery: '2026-05-27', driver: 'Owen Fischer', vehicle: 'TRK-309', route: 'RTE-SEA-DEN', progress: 50, valueUsd: 104000, costUsd: 1120, lastUpdate: '2026-05-28T06:20:00Z', lastLocation: 'Boise, ID — damaged carton flagged' },
  { id: 'SHP-100278', trackingNumber: 'ST-2026-3C29B5', status: 'delivered', customer: 'Sunbelt Grocers', customerId: 'CUS-003', carrier: 'ShipTrack Fleet', service: 'standard', priority: 'medium', origin: 'Phoenix, AZ', originCode: 'PHX', destination: 'Los Angeles, CA', destinationCode: 'LAX', weightKg: 2400, pieces: 28, contents: 'Grocery dry goods', createdDate: '2026-05-21', shipDate: '2026-05-21', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-22', driver: 'Marcus Bell', vehicle: 'TRK-118', route: 'RTE-PHX-LA', progress: 100, valueUsd: 41000, costUsd: 1290, lastUpdate: '2026-05-22T14:30:00Z', lastLocation: 'Los Angeles — delivered' },
  { id: 'SHP-100271', trackingNumber: 'ST-2026-8D63E0', status: 'in-transit', customer: 'Atlas Pharma', customerId: 'CUS-004', carrier: 'ShipTrack Fleet', service: 'overnight', priority: 'critical', origin: 'Chicago, IL', originCode: 'ORD', destination: 'Minneapolis, MN', destinationCode: 'MSP', weightKg: 44, pieces: 4, contents: 'Clinical samples', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', driver: 'Greta Lindqvist', vehicle: 'VAN-130', route: 'RTE-MCI-MSP', progress: 25, valueUsd: 156000, costUsd: 880, lastUpdate: '2026-05-28T13:10:00Z', lastLocation: 'Rockford, IL' },
  { id: 'SHP-100265', trackingNumber: 'ST-2026-2F41A9', status: 'pending', customer: 'Coastal Apparel Co.', customerId: 'CUS-006', carrier: 'Falcon Freight', service: 'standard', priority: 'low', origin: 'Miami, FL', originCode: 'MIA', destination: 'Orlando, FL', destinationCode: 'MCO', weightKg: 340, pieces: 18, contents: 'Apparel restock', createdDate: '2026-05-28', shipDate: '2026-05-29', estimatedDelivery: '2026-05-31', progress: 5, valueUsd: 22000, costUsd: 520, lastUpdate: '2026-05-28T08:55:00Z', lastLocation: 'Miami origin DC' },
  { id: 'SHP-100259', trackingNumber: 'ST-2026-6E72C3', status: 'delivered', customer: 'Granite Construction Supply', customerId: 'CUS-007', carrier: 'BlueWave Carriers', service: 'freight', priority: 'medium', origin: 'Houston, TX', originCode: 'IAH', destination: 'Dallas, TX', destinationCode: 'DFW', weightKg: 9100, pieces: 64, contents: 'Concrete forms', createdDate: '2026-05-18', shipDate: '2026-05-19', estimatedDelivery: '2026-05-22', actualDelivery: '2026-05-21', driver: 'Carlos Mendez', vehicle: 'TRK-211', route: 'RTE-DFW-IAH', progress: 100, valueUsd: 112000, costUsd: 3100, lastUpdate: '2026-05-21T15:25:00Z', lastLocation: 'Dallas — delivered' },
  { id: 'SHP-100253', trackingNumber: 'ST-2026-9C18B7', status: 'out-for-delivery', customer: 'BlueLeaf Organics', customerId: 'CUS-008', carrier: 'ShipTrack Fleet', service: 'same-day', priority: 'high', origin: 'San Francisco, CA', originCode: 'SFO', destination: 'Oakland, CA', destinationCode: 'OAK', weightKg: 52, pieces: 9, contents: 'Refrigerated produce', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-28', driver: 'Leah Park', vehicle: 'VAN-121', route: 'RTE-SFO-OAK', progress: 88, valueUsd: 7600, costUsd: 160, lastUpdate: '2026-05-28T14:00:00Z', lastLocation: 'Oakland — last mile' },
  { id: 'SHP-100247', trackingNumber: 'ST-2026-3D85F1', status: 'in-transit', customer: 'Horizon Furniture', customerId: 'CUS-010', carrier: 'Apex Cargo', service: 'freight', priority: 'low', origin: 'Los Angeles, CA', originCode: 'LAX', destination: 'Phoenix, AZ', destinationCode: 'PHX', weightKg: 4700, pieces: 26, contents: 'Upholstered seating', createdDate: '2026-05-27', shipDate: '2026-05-27', estimatedDelivery: '2026-05-30', driver: 'Marcus Bell', vehicle: 'TRK-118', route: 'RTE-LA-PHX', progress: 52, valueUsd: 69000, costUsd: 2050, lastUpdate: '2026-05-28T11:50:00Z', lastLocation: 'Blythe, CA' },
  { id: 'SHP-100240', trackingNumber: 'ST-2026-8B49D6', status: 'delivered', customer: 'Quantum Components', customerId: 'CUS-011', carrier: 'ShipTrack Fleet', service: 'overnight', priority: 'critical', origin: 'New York, NY', originCode: 'JFK', destination: 'Newark, NJ', destinationCode: 'EWR', weightKg: 36, pieces: 5, contents: 'Lab instrumentation', createdDate: '2026-05-25', shipDate: '2026-05-25', estimatedDelivery: '2026-05-26', actualDelivery: '2026-05-26', driver: 'Isabela Cruz', vehicle: 'VAN-105', route: 'RTE-NYC-EWR', progress: 100, valueUsd: 142000, costUsd: 690, lastUpdate: '2026-05-26T10:40:00Z', lastLocation: 'Newark — delivered' },
  { id: 'SHP-100234', trackingNumber: 'ST-2026-2C57E8', status: 'delivered', customer: 'Evergreen Foods', customerId: 'CUS-012', carrier: 'RoadRunner Logistics', service: 'standard', priority: 'medium', origin: 'Seattle, WA', originCode: 'SEA', destination: 'Portland, OR', destinationCode: 'PDX', weightKg: 2200, pieces: 26, contents: 'Frozen foods', createdDate: '2026-05-20', shipDate: '2026-05-20', estimatedDelivery: '2026-05-22', actualDelivery: '2026-05-22', driver: 'Owen Fischer', vehicle: 'TRK-301', route: 'RTE-SEA-PDX', progress: 100, valueUsd: 36000, costUsd: 1150, lastUpdate: '2026-05-22T17:15:00Z', lastLocation: 'Portland — delivered' },
  { id: 'SHP-100228', trackingNumber: 'ST-2026-6A93C2', status: 'in-transit', customer: 'Nordwind Retail Group', customerId: 'CUS-001', carrier: 'ShipTrack Fleet', service: 'express', priority: 'medium', origin: 'Denver, CO', originCode: 'DEN', destination: 'Kansas City, MO', destinationCode: 'MCI', weightKg: 410, pieces: 19, contents: 'Retail seasonal', createdDate: '2026-05-27', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', driver: 'Tasha Okafor', vehicle: 'VAN-140', route: 'RTE-CHI-DEN', progress: 33, valueUsd: 53000, costUsd: 820, lastUpdate: '2026-05-28T12:55:00Z', lastLocation: 'Salina, KS' },
  { id: 'SHP-100221', trackingNumber: 'ST-2026-9D26A4', status: 'delivered', customer: 'Pinnacle Medical', customerId: 'CUS-009', carrier: 'ShipTrack Fleet', service: 'express', priority: 'high', origin: 'Atlanta, GA', originCode: 'ATL', destination: 'Miami, FL', destinationCode: 'MIA', weightKg: 150, pieces: 6, contents: 'Diagnostic kits', createdDate: '2026-05-21', shipDate: '2026-05-21', estimatedDelivery: '2026-05-23', actualDelivery: '2026-05-23', driver: 'Hannah Cole', vehicle: 'VAN-119', route: 'RTE-MIA-ATL', progress: 100, valueUsd: 64000, costUsd: 700, lastUpdate: '2026-05-23T12:10:00Z', lastLocation: 'Miami — delivered' },
  { id: 'SHP-100215', trackingNumber: 'ST-2026-3F84B0', status: 'delayed', customer: 'Vertex Auto Parts', customerId: 'CUS-005', carrier: 'Falcon Freight', service: 'freight', priority: 'medium', origin: 'Detroit, MI', originCode: 'DTW', destination: 'Chicago, IL', destinationCode: 'ORD', weightKg: 5800, pieces: 50, contents: 'Transmission parts', createdDate: '2026-05-26', shipDate: '2026-05-26', estimatedDelivery: '2026-05-28', driver: 'Isabela Cruz', vehicle: 'TRK-214', route: 'RTE-NYC-CHI', progress: 60, valueUsd: 134000, costUsd: 2700, lastUpdate: '2026-05-28T09:05:00Z', lastLocation: 'Gary, IN — congestion delay' },
  { id: 'SHP-100208', trackingNumber: 'ST-2026-8C61E5', status: 'delivered', customer: 'Sunbelt Grocers', customerId: 'CUS-003', carrier: 'Apex Cargo', service: 'freight', priority: 'low', origin: 'Dallas, TX', originCode: 'DFW', destination: 'Houston, TX', destinationCode: 'IAH', weightKg: 7800, pieces: 56, contents: 'Bulk staples', createdDate: '2026-05-17', shipDate: '2026-05-18', estimatedDelivery: '2026-05-20', actualDelivery: '2026-05-20', driver: 'Carlos Mendez', vehicle: 'TRK-211', route: 'RTE-DFW-IAH', progress: 100, valueUsd: 49000, costUsd: 2400, lastUpdate: '2026-05-20T16:35:00Z', lastLocation: 'Houston — delivered' },
  { id: 'SHP-100202', trackingNumber: 'ST-2026-2A38D9', status: 'in-transit', customer: 'Meridian Electronics', customerId: 'CUS-002', carrier: 'ShipTrack Fleet', service: 'express', priority: 'high', origin: 'San Francisco, CA', originCode: 'SFO', destination: 'Los Angeles, CA', destinationCode: 'LAX', weightKg: 190, pieces: 11, contents: 'Server modules', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', driver: 'Leah Park', vehicle: 'VAN-121', route: 'RTE-LA-SFO', progress: 28, valueUsd: 118000, costUsd: 740, lastUpdate: '2026-05-28T13:35:00Z', lastLocation: 'Gilroy, CA' },
  { id: 'SHP-100196', trackingNumber: 'ST-2026-6D72A1', status: 'delivered', customer: 'BlueLeaf Organics', customerId: 'CUS-008', carrier: 'ShipTrack Fleet', service: 'same-day', priority: 'medium', origin: 'San Francisco, CA', originCode: 'SFO', destination: 'San Francisco, CA', destinationCode: 'SFO', weightKg: 40, pieces: 7, contents: 'Cafe supplies', createdDate: '2026-05-24', shipDate: '2026-05-24', estimatedDelivery: '2026-05-24', actualDelivery: '2026-05-24', driver: 'Leah Park', vehicle: 'VAN-121', route: 'RTE-SFO-SFO', progress: 100, valueUsd: 5200, costUsd: 140, lastUpdate: '2026-05-24T15:50:00Z', lastLocation: 'San Francisco — delivered' },
  { id: 'SHP-100189', trackingNumber: 'ST-2026-9E45C8', status: 'delivered', customer: 'Horizon Furniture', customerId: 'CUS-010', carrier: 'RoadRunner Logistics', service: 'freight', priority: 'low', origin: 'Chicago, IL', originCode: 'ORD', destination: 'Minneapolis, MN', destinationCode: 'MSP', weightKg: 4100, pieces: 22, contents: 'Storage units', createdDate: '2026-05-16', shipDate: '2026-05-17', estimatedDelivery: '2026-05-20', actualDelivery: '2026-05-19', driver: 'Greta Lindqvist', vehicle: 'TRK-220', route: 'RTE-MCI-MSP', progress: 100, valueUsd: 58000, costUsd: 1950, lastUpdate: '2026-05-19T14:20:00Z', lastLocation: 'Minneapolis — delivered' },
  { id: 'SHP-100183', trackingNumber: 'ST-2026-3C29E7', status: 'in-transit', customer: 'Atlas Pharma', customerId: 'CUS-004', carrier: 'ShipTrack Fleet', service: 'overnight', priority: 'critical', origin: 'New York, NY', originCode: 'JFK', destination: 'Boston, MA', destinationCode: 'BOS', weightKg: 30, pieces: 3, contents: 'Biologics', createdDate: '2026-05-28', shipDate: '2026-05-28', estimatedDelivery: '2026-05-29', driver: 'Devin Walsh', vehicle: 'VAN-102', route: 'RTE-NYC-BOS', progress: 22, valueUsd: 198000, costUsd: 920, lastUpdate: '2026-05-28T13:50:00Z', lastLocation: 'New Haven, CT' },
  { id: 'SHP-100177', trackingNumber: 'ST-2026-8A53B4', status: 'delivered', customer: 'Quantum Components', customerId: 'CUS-011', carrier: 'BlueWave Carriers', service: 'express', priority: 'high', origin: 'Phoenix, AZ', originCode: 'PHX', destination: 'Denver, CO', destinationCode: 'DEN', weightKg: 240, pieces: 12, contents: 'Optical modules', createdDate: '2026-05-19', shipDate: '2026-05-19', estimatedDelivery: '2026-05-21', actualDelivery: '2026-05-21', driver: 'Owen Fischer', vehicle: 'TRK-309', route: 'RTE-PHX-DEN', progress: 100, valueUsd: 126000, costUsd: 1080, lastUpdate: '2026-05-21T13:40:00Z', lastLocation: 'Denver — delivered' },
  { id: 'SHP-100171', trackingNumber: 'ST-2026-2D67F3', status: 'pending', customer: 'Evergreen Foods', customerId: 'CUS-012', carrier: 'Apex Cargo', service: 'freight', priority: 'low', origin: 'Portland, OR', originCode: 'PDX', destination: 'Seattle, WA', destinationCode: 'SEA', weightKg: 6100, pieces: 48, contents: 'Bottled beverages', createdDate: '2026-05-28', shipDate: '2026-05-29', estimatedDelivery: '2026-05-31', progress: 5, valueUsd: 41000, costUsd: 2200, lastUpdate: '2026-05-28T10:15:00Z', lastLocation: 'Portland origin terminal' },
  { id: 'SHP-100164', trackingNumber: 'ST-2026-6B82D0', status: 'delivered', customer: 'Nordwind Retail Group', customerId: 'CUS-001', carrier: 'ShipTrack Fleet', service: 'standard', priority: 'medium', origin: 'Kansas City, MO', originCode: 'MCI', destination: 'Chicago, IL', destinationCode: 'ORD', weightKg: 1100, pieces: 17, contents: 'Retail electronics', createdDate: '2026-05-18', shipDate: '2026-05-18', estimatedDelivery: '2026-05-20', actualDelivery: '2026-05-20', driver: 'Tasha Okafor', vehicle: 'TRK-208', route: 'RTE-CHI-MCI', progress: 100, valueUsd: 62000, costUsd: 1310, lastUpdate: '2026-05-20T15:05:00Z', lastLocation: 'Chicago — delivered' },
]

export function findShipment(id: string): Shipment | undefined {
  return SHIPMENTS.find((s) => s.id === id || s.trackingNumber === id)
}

/** Active = anything still moving through the network. */
export function isActive(s: Shipment): boolean {
  return !['delivered', 'returned'].includes(s.status)
}

export function isException(s: Shipment): boolean {
  return s.status === 'exception' || s.status === 'delayed'
}
