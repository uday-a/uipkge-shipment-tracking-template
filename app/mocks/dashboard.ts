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
    label: 'Active orders',
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

// Aggregate status mix across the whole active operation. Colours follow the
// Harbor ramp: teal/sand for neutral in-progress states, semantic
// amber/red/green for delayed / exception / delivered.
export const STATUS_SPLIT: StatusSlice[] = [
  { name: 'In transit', value: 412, color: '#2a8f88' },
  { name: 'Out for delivery', value: 168, color: '#5fb3a8' },
  { name: 'Pending pickup', value: 294, color: '#cbb78a' },
  { name: 'Delayed', value: 96, color: '#c28a00' },
  { name: 'Exception', value: 38, color: '#c0392b' },
  { name: 'Delivered today', value: 276, color: '#2e8b57' },
]

export interface CarrierPerf {
  carrier: string
  onTime: number
  volume: number
}

export const CARRIER_PERFORMANCE: CarrierPerf[] = [
  { carrier: 'Zepp Linehaul', onTime: 96, volume: 540 },
  { carrier: 'Metro Courier', onTime: 93, volume: 318 },
  { carrier: 'RoadRunner Logistics', onTime: 91, volume: 264 },
  { carrier: 'Pacific Drayage', onTime: 89, volume: 188 },
  { carrier: 'Sunbelt Freight', onTime: 92, volume: 142 },
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
  { id: 'a1', type: 'out-for-delivery', timeUtc: '2026-05-28T14:05:00Z', actor: { name: 'Marcus Bell', initials: 'MB' }, text: 'MOV-L4101 out for delivery to Daniel Reyes in Los Angeles', meta: 'ETA today' },
  { id: 'a2', type: 'exception', timeUtc: '2026-05-28T08:15:00Z', actor: { name: 'Hannah Cole', initials: 'HC' }, text: 'MOV-T2006 transfer to Miami DC — damaged carton flagged in Jacksonville', meta: 'Needs action' },
  { id: 'a3', type: 'delayed', timeUtc: '2026-05-28T13:20:00Z', actor: { name: 'Owen Fischer', initials: 'OF' }, text: 'MOV-L4103 delayed in Tacoma, WA — Zepp Trail X for Nathan Brooks', meta: 'Last mile' },
  { id: 'a4', type: 'picked-up', timeUtc: '2026-05-28T13:48:00Z', actor: { name: 'Tasha Okafor', initials: 'TO' }, text: 'MOV-T2003 departed East Coast Import Hub for Chicago DC' },
  { id: 'a5', type: 'delivered', timeUtc: '2026-05-28T11:25:00Z', actor: { name: 'Hannah Cole', initials: 'HC' }, text: 'MOV-L4111 delivered to Mason Rivera in Miami', meta: 'Express' },
  { id: 'a6', type: 'customs', timeUtc: '2026-05-28T09:30:00Z', actor: { name: 'System', initials: 'sys' }, text: 'CTR-88150 in customs at Long Beach — 320 bikes aboard Cosco Harmony' },
  { id: 'a7', type: 'customs', timeUtc: '2026-05-28T08:45:00Z', actor: { name: 'System', initials: 'sys' }, text: 'CTR-77226 customs hold at Port of Newark' },
  { id: 'a8', type: 'out-for-delivery', timeUtc: '2026-05-28T13:55:00Z', actor: { name: 'Tasha Okafor', initials: 'TO' }, text: 'MOV-L4116 last mile to Mia Thompson in Chicago', meta: 'Express' },
  { id: 'a9', type: 'delivered', timeUtc: '2026-05-27T19:08:00Z', actor: { name: 'Devin Walsh', initials: 'DW' }, text: 'MOV-T2010 transfer received at Boston DC' },
  { id: 'a10', type: 'picked-up', timeUtc: '2026-05-28T12:30:00Z', actor: { name: 'System', initials: 'sys' }, text: 'MOV-L4108 queued for pickup at Chicago DC' },
  { id: 'a11', type: 'delayed', timeUtc: '2026-05-28T09:05:00Z', actor: { name: 'Amara Diallo', initials: 'AD' }, text: 'MOV-L4105 address unverified in Aurora, CO', meta: 'Last mile' },
  { id: 'a12', type: 'delivered', timeUtc: '2026-05-28T10:05:00Z', actor: { name: 'System', initials: 'sys' }, text: 'CTR-88142 received at West Coast Import Hub — 360 bikes' },
]

export interface QuickAction {
  label: string
  description: string
  icon: string
  to: string
  requires?: 'dispatcher' | 'admin'
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'New order', description: 'Book a consumer delivery', icon: 'PackagePlus', to: '/shipments/new', requires: 'dispatcher' },
  { label: 'Track my bike', description: 'Look up by tracking number', icon: 'Search', to: '/tracking' },
  { label: 'Review exceptions', description: '18 need attention', icon: 'TriangleAlert', to: '/shipments?status=exception', requires: 'dispatcher' },
  { label: 'Inbound containers', description: 'Ocean freight from China', icon: 'Ship', to: '/containers', requires: 'dispatcher' },
]
