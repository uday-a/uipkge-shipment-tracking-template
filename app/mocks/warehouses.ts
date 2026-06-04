/**
 * COMPATIBILITY SHIM. The flat warehouse list became the two-tier Zepp
 * network (import warehouses + distribution centers) — see `network.ts`.
 * This re-exports the warehouse subset under the old names. New code should
 * import from `./network` directly.
 */
import {
  NETWORK, warehouses, findLocation,
  LOCATION_STATUS_LABELS, LOCATION_STATUS_TONE,
  type NetworkLocation, type LocationStatus,
} from './network'

export type WarehouseStatus = LocationStatus
export type Warehouse = NetworkLocation

export const WAREHOUSE_STATUS_LABELS = LOCATION_STATUS_LABELS
export const WAREHOUSE_STATUS_TONE = LOCATION_STATUS_TONE

/** Import warehouses only (the old `WAREHOUSES` concept). */
export const WAREHOUSES: NetworkLocation[] = warehouses()

export function findWarehouse(id: string): NetworkLocation | undefined {
  const loc = findLocation(id)
  return loc?.type === 'warehouse' ? loc : NETWORK.find((l) => l.id === id)
}
