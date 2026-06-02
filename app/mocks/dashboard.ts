/**
 * Mock data for the operations dashboard. Numbers are hand-tuned to read
 * like a mid-size carrier's control tower — not "KPI 1 / KPI 2". The KPI
 * tiles describe the whole operation (thousands of shipments); the
 * Shipments page drills into the detailed ledger. All values are static
 * (no Date.now(), no Math.random()) so SSR + client render identically.
 */

export interface KpiTile {
  label: string
  value: string
  delta?: { value: string; positive: boolean }
  spark?: number[]
  hint?: string
  tone: 'info' | 'success' | 'warning' | 'destructive'
  icon: string
}

export const KPI_TILES: KpiTile[] = [
  {
    label: 'Active shipments',
    value: '1,284',
    delta: { value: '+8.2%', positive: true },
    spark: [1042, 1071, 1098, 1110, 1135, 1152, 1168, 1190, 1205, 1228, 1256, 1284],
    hint: 'vs last week',
    tone: 'info',
    icon: 'Package',
  },
  {
    label: 'On-time delivery',
    value: '94.6%',
    delta: { value: '+1.3pp', positive: true },
    spark: [91.2, 91.8, 92.1, 92.4, 92.0, 92.7, 93.1, 93.4, 93.8, 94.0, 94.3, 94.6],
    hint: 'Target 95%',
    tone: 'success',
    icon: 'CircleCheck',
  },
  {
    label: 'In transit now',
    value: '412',
    delta: { value: '+24', positive: true },
    spark: [356, 362, 371, 380, 388, 372, 395, 401, 390, 405, 408, 412],
    hint: 'Across 16 lanes',
    tone: 'info',
    icon: 'Truck',
  },
  {
    label: 'Open exceptions',
    value: '18',
    delta: { value: '-5', positive: true },
    spark: [31, 29, 28, 26, 27, 24, 25, 22, 23, 21, 20, 18],
    hint: 'Delays + holds',
    tone: 'warning',
    icon: 'TriangleAlert',
  },
]

export interface VolumePoint {
  month: string
  shipments: number
  delivered: number
}

// Trailing 12 months ending May 2026.
export const SHIPMENT_VOLUME: VolumePoint[] = [
  { month: 'Jun', shipments: 3820, delivered: 3610 },
  { month: 'Jul', shipments: 3960, delivered: 3742 },
  { month: 'Aug', shipments: 4105, delivered: 3901 },
  { month: 'Sep', shipments: 4280, delivered: 4072 },
  { month: 'Oct', shipments: 4520, delivered: 4291 },
  { month: 'Nov', shipments: 5140, delivered: 4860 },
  { month: 'Dec', shipments: 5680, delivered: 5320 },
  { month: 'Jan', shipments: 4390, delivered: 4180 },
  { month: 'Feb', shipments: 4210, delivered: 4015 },
  { month: 'Mar', shipments: 4640, delivered: 4422 },
  { month: 'Apr', shipments: 4880, delivered: 4651 },
  { month: 'May', shipments: 5020, delivered: 4748 },
]

export interface StatusSlice {
  name: string
  value: number
  color: string
}

// Aggregate status mix across the whole active operation.
export const STATUS_SPLIT: StatusSlice[] = [
  { name: 'In transit', value: 412, color: '#3b82f6' },
  { name: 'Out for delivery', value: 168, color: '#06b6d4' },
  { name: 'Pending pickup', value: 294, color: '#a855f7' },
  { name: 'Delayed', value: 96, color: '#f59e0b' },
  { name: 'Exception', value: 38, color: '#f43f5e' },
  { name: 'Delivered today', value: 276, color: '#10b981' },
]

export interface CarrierPerf {
  carrier: string
  onTime: number
  volume: number
}

export const CARRIER_PERFORMANCE: CarrierPerf[] = [
  { carrier: 'ShipTrack Fleet', onTime: 96, volume: 540 },
  { carrier: 'Falcon Freight', onTime: 93, volume: 318 },
  { carrier: 'RoadRunner Logistics', onTime: 91, volume: 264 },
  { carrier: 'BlueWave Carriers', onTime: 89, volume: 188 },
  { carrier: 'Apex Cargo', onTime: 92, volume: 142 },
]

export interface RegionVolume {
  region: string
  value: number
}

export const DELIVERY_BY_REGION: RegionVolume[] = [
  { region: 'West', value: 384 },
  { region: 'Midwest', value: 312 },
  { region: 'Northeast', value: 268 },
  { region: 'South', value: 226 },
  { region: 'Southeast', value: 194 },
]

export type ActivityType =
  | 'delivered'
  | 'picked-up'
  | 'departed'
  | 'exception'
  | 'delayed'
  | 'customs'
  | 'out-for-delivery'

export interface ActivityEntry {
  id: string
  type: ActivityType
  timeUtc: string
  actor: { name: string; initials: string }
  text: string
  meta?: string
}

export const ACTIVITY: ActivityEntry[] = [
  { id: 'a1', type: 'out-for-delivery', timeUtc: '2026-05-28T14:05:00Z', actor: { name: 'Marcus Bell', initials: 'MB' }, text: 'SHP-100412 out for delivery in Phoenix, AZ', meta: 'ETA today' },
  { id: 'a2', type: 'exception', timeUtc: '2026-05-28T08:15:00Z', actor: { name: 'Priya Nair', initials: 'PN' }, text: 'SHP-100390 held for inspection in Nashville, TN', meta: 'Needs action' },
  { id: 'a3', type: 'delayed', timeUtc: '2026-05-28T13:20:00Z', actor: { name: 'Devin Walsh', initials: 'DW' }, text: 'SHP-100401 delayed by weather near Hartford, CT', meta: 'Cold-chain' },
  { id: 'a4', type: 'picked-up', timeUtc: '2026-05-28T13:48:00Z', actor: { name: 'Owen Fischer', initials: 'OF' }, text: 'SHP-100364 picked up at Portland origin DC' },
  { id: 'a5', type: 'delivered', timeUtc: '2026-05-28T11:25:00Z', actor: { name: 'Leah Park', initials: 'LP' }, text: 'SHP-100333 delivered in San Jose, CA', meta: 'Same-day' },
  { id: 'a6', type: 'departed', timeUtc: '2026-05-28T11:42:00Z', actor: { name: 'Tasha Okafor', initials: 'TO' }, text: 'SHP-100408 passed Lincoln, NE on the Denver lane' },
  { id: 'a7', type: 'customs', timeUtc: '2026-05-28T07:10:00Z', actor: { name: 'System', initials: 'sys' }, text: 'SHP-100390 customs paperwork flagged for review' },
  { id: 'a8', type: 'out-for-delivery', timeUtc: '2026-05-28T13:55:00Z', actor: { name: 'Devin Walsh', initials: 'DW' }, text: 'SHP-100342 last-mile in Manhattan', meta: 'Critical' },
  { id: 'a9', type: 'delivered', timeUtc: '2026-05-27T19:08:00Z', actor: { name: 'Carlos Mendez', initials: 'CM' }, text: 'SHP-100395 delivered to Sunbelt Grocers, Houston' },
  { id: 'a10', type: 'picked-up', timeUtc: '2026-05-28T12:30:00Z', actor: { name: 'System', initials: 'sys' }, text: 'SHP-100379 queued for same-day pickup in San Francisco' },
  { id: 'a11', type: 'delayed', timeUtc: '2026-05-28T09:05:00Z', actor: { name: 'Isabela Cruz', initials: 'IC' }, text: 'SHP-100215 congestion delay near Gary, IN' },
  { id: 'a12', type: 'departed', timeUtc: '2026-05-28T10:05:00Z', actor: { name: 'Owen Fischer', initials: 'OF' }, text: 'SHP-100385 departed Olympia, WA southbound' },
]

export interface QuickAction {
  label: string
  description: string
  icon: string
  to: string
  requires?: 'dispatcher' | 'admin'
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Create shipment', description: 'Book a new pickup', icon: 'PackagePlus', to: '/shipments/new', requires: 'dispatcher' },
  { label: 'Track a package', description: 'Look up by tracking number', icon: 'Search', to: '/tracking' },
  { label: 'Review exceptions', description: '18 need attention', icon: 'TriangleAlert', to: '/shipments?status=exception', requires: 'dispatcher' },
  { label: 'Fleet status', description: '20 vehicles online', icon: 'Truck', to: '/fleet', requires: 'dispatcher' },
]
