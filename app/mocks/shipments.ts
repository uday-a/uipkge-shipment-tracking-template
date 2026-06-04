/**
 * COMPATIBILITY SHIM. The shipment ledger was renamed to the Zepp movement
 * ledger — see `movements.ts` (the real source of truth). This module
 * re-exports it under the old names so existing importers keep working while
 * pages are migrated to the new terminology. New code should import from
 * `./movements` directly.
 */
export * from './movements'

import { MOVEMENTS, findMovement, type Movement } from './movements'

export type Shipment = Movement
export const SHIPMENTS: Movement[] = MOVEMENTS
export const findShipment = findMovement
