/**
 * Zepp stock position — on-hand bikes per model × location. Hand-built,
 * deterministic snapshot. Import warehouses hold bulk (received containers);
 * distribution centers hold smaller buffers (replenished by transfers,
 * drawn down by last-mile orders).
 *
 * `allocated` = units already committed to an open order/transfer but not yet
 * shipped; `onHand − allocated = available`.
 */
import { CATALOG } from './catalog'
import { NETWORK } from './network'

export interface StockRow {
  locationId: string
  sku: string
  onHand: number
  allocated: number
}

// locationId → sku → [onHand, allocated]. Compact authoring; flattened below.
const RAW: Record<string, Record<string, [number, number]>> = {
  // ── Import warehouses (bulk) ────────────────────────────────────────
  'WH-LGB': { 'ZB-CITY': [460, 80], 'ZB-PRO': [280, 50], 'ZB-TRAIL': [150, 30], 'ZB-CARGO': [120, 20], 'ZB-LITE': [360, 60], 'ZB-FOLD': [140, 24] },
  'WH-EWR': { 'ZB-CITY': [380, 70], 'ZB-PRO': [300, 55], 'ZB-TRAIL': [130, 22], 'ZB-CARGO': [90, 16], 'ZB-LITE': [280, 48], 'ZB-FOLD': [170, 30] },
  'WH-SAV': { 'ZB-CITY': [320, 44], 'ZB-PRO': [180, 28], 'ZB-TRAIL': [120, 18], 'ZB-CARGO': [110, 20], 'ZB-LITE': [240, 36], 'ZB-FOLD': [90, 12] },

  // ── Distribution centers (buffers) ──────────────────────────────────
  'DC-LAX': { 'ZB-CITY': [54, 12], 'ZB-PRO': [38, 8], 'ZB-TRAIL': [18, 4], 'ZB-CARGO': [12, 3], 'ZB-LITE': [42, 9], 'ZB-FOLD': [16, 4] },
  'DC-SFO': { 'ZB-CITY': [40, 14], 'ZB-PRO': [44, 12], 'ZB-TRAIL': [16, 5], 'ZB-CARGO': [10, 2], 'ZB-LITE': [30, 8], 'ZB-FOLD': [22, 6] },
  'DC-SEA': { 'ZB-CITY': [32, 6], 'ZB-PRO': [26, 5], 'ZB-TRAIL': [24, 6], 'ZB-CARGO': [8, 1], 'ZB-LITE': [28, 6], 'ZB-FOLD': [12, 2] },
  'DC-PHX': { 'ZB-CITY': [38, 8], 'ZB-PRO': [22, 4], 'ZB-TRAIL': [14, 3], 'ZB-CARGO': [16, 4], 'ZB-LITE': [34, 7], 'ZB-FOLD': [10, 2] },
  'DC-DEN': { 'ZB-CITY': [20, 8], 'ZB-PRO': [18, 6], 'ZB-TRAIL': [10, 3], 'ZB-CARGO': [14, 5], 'ZB-LITE': [16, 5], 'ZB-FOLD': [6, 2] },
  'DC-JFK': { 'ZB-CITY': [48, 12], 'ZB-PRO': [40, 10], 'ZB-TRAIL': [20, 5], 'ZB-CARGO': [9, 2], 'ZB-LITE': [30, 7], 'ZB-FOLD': [28, 8] },
  'DC-BOS': { 'ZB-CITY': [30, 6], 'ZB-PRO': [28, 6], 'ZB-TRAIL': [14, 3], 'ZB-CARGO': [7, 1], 'ZB-LITE': [22, 5], 'ZB-FOLD': [14, 3] },
  'DC-ORD': { 'ZB-CITY': [44, 10], 'ZB-PRO': [34, 8], 'ZB-TRAIL': [16, 4], 'ZB-CARGO': [13, 3], 'ZB-LITE': [36, 8], 'ZB-FOLD': [18, 4] },
  'DC-EWR': { 'ZB-CITY': [26, 9], 'ZB-PRO': [20, 6], 'ZB-TRAIL': [10, 2], 'ZB-CARGO': [6, 1], 'ZB-LITE': [24, 6], 'ZB-FOLD': [12, 3] },
  'DC-ATL': { 'ZB-CITY': [40, 9], 'ZB-PRO': [26, 6], 'ZB-TRAIL': [22, 5], 'ZB-CARGO': [12, 3], 'ZB-LITE': [28, 6], 'ZB-FOLD': [12, 2] },
  'DC-MIA': { 'ZB-CITY': [22, 4], 'ZB-PRO': [16, 3], 'ZB-TRAIL': [12, 2], 'ZB-CARGO': [8, 1], 'ZB-LITE': [18, 3], 'ZB-FOLD': [8, 1] },
  'DC-DFW': { 'ZB-CITY': [36, 8], 'ZB-PRO': [24, 5], 'ZB-TRAIL': [14, 3], 'ZB-CARGO': [18, 4], 'ZB-LITE': [30, 6], 'ZB-FOLD': [10, 2] },
}

export const STOCK: StockRow[] = Object.entries(RAW).flatMap(([locationId, perSku]) =>
  Object.entries(perSku).map(([sku, [onHand, allocated]]) => ({ locationId, sku, onHand, allocated })),
)

export function stockFor(locationId: string): StockRow[] {
  return STOCK.filter((r) => r.locationId === locationId)
}

export function stockOf(sku: string): StockRow[] {
  return STOCK.filter((r) => r.sku === sku)
}

export function onHandAt(locationId: string, sku: string): number {
  return STOCK.find((r) => r.locationId === locationId && r.sku === sku)?.onHand ?? 0
}

/** Total bikes on hand at a location (all models). */
export function locationOnHand(locationId: string): number {
  return stockFor(locationId).reduce((sum, r) => sum + r.onHand, 0)
}

/** Total bikes on hand across the network for one model. */
export function skuOnHand(sku: string): number {
  return stockOf(sku).reduce((sum, r) => sum + r.onHand, 0)
}

/** Network-wide bike count on hand. */
export function networkOnHand(): number {
  return STOCK.reduce((sum, r) => sum + r.onHand, 0)
}

/** Available = onHand − allocated, network-wide for a model. */
export function skuAvailable(sku: string): number {
  return stockOf(sku).reduce((sum, r) => sum + (r.onHand - r.allocated), 0)
}

/** DC rows whose available stock sits at or below `threshold` (replenish flags). */
export function lowStock(threshold = 10): StockRow[] {
  const dcIds = new Set(NETWORK.filter((l) => l.type === 'dc').map((l) => l.id))
  return STOCK.filter((r) => dcIds.has(r.locationId) && r.onHand - r.allocated <= threshold)
}

/** All known SKUs, in catalog order (convenience for table columns). */
export const STOCK_SKUS: string[] = CATALOG.map((m) => m.sku)
