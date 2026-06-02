/**
 * Mock distribution-center network. Hand-built, deterministic.
 */
export type WarehouseStatus = 'operational' | 'near-capacity' | 'maintenance'

export interface Warehouse {
  id: string
  name: string
  city: string
  code: string
  capacityPct: number
  inboundToday: number
  outboundToday: number
  staff: number
  status: WarehouseStatus
  sqft: number
}

export const WAREHOUSE_STATUS_LABELS: Record<WarehouseStatus, string> = {
  operational: 'Operational',
  'near-capacity': 'Near capacity',
  maintenance: 'Maintenance',
}

export const WAREHOUSE_STATUS_TONE: Record<WarehouseStatus, 'success' | 'warning' | 'muted'> = {
  operational: 'success',
  'near-capacity': 'warning',
  maintenance: 'muted',
}

export const WAREHOUSES: Warehouse[] = [
  { id: 'WH-LAX', name: 'West Coast Hub', city: 'Los Angeles, CA', code: 'LAX', capacityPct: 78, inboundToday: 64, outboundToday: 71, staff: 142, status: 'operational', sqft: 320000 },
  { id: 'WH-ORD', name: 'Midwest Hub', city: 'Chicago, IL', code: 'ORD', capacityPct: 91, inboundToday: 88, outboundToday: 79, staff: 168, status: 'near-capacity', sqft: 410000 },
  { id: 'WH-JFK', name: 'Northeast Hub', city: 'New York, NY', code: 'JFK', capacityPct: 84, inboundToday: 52, outboundToday: 60, staff: 121, status: 'operational', sqft: 280000 },
  { id: 'WH-DFW', name: 'South Central Hub', city: 'Dallas, TX', code: 'DFW', capacityPct: 66, inboundToday: 47, outboundToday: 55, staff: 134, status: 'operational', sqft: 360000 },
  { id: 'WH-ATL', name: 'Southeast Hub', city: 'Atlanta, GA', code: 'ATL', capacityPct: 73, inboundToday: 41, outboundToday: 49, staff: 110, status: 'operational', sqft: 300000 },
  { id: 'WH-SEA', name: 'Pacific Northwest DC', city: 'Seattle, WA', code: 'SEA', capacityPct: 58, inboundToday: 33, outboundToday: 38, staff: 86, status: 'operational', sqft: 210000 },
  { id: 'WH-DEN', name: 'Mountain DC', city: 'Denver, CO', code: 'DEN', capacityPct: 94, inboundToday: 39, outboundToday: 28, staff: 74, status: 'near-capacity', sqft: 180000 },
  { id: 'WH-MIA', name: 'Gulf Coast DC', city: 'Miami, FL', code: 'MIA', capacityPct: 47, inboundToday: 22, outboundToday: 31, staff: 68, status: 'maintenance', sqft: 160000 },
]

export function findWarehouse(id: string): Warehouse | undefined {
  return WAREHOUSES.find((w) => w.id === id)
}
