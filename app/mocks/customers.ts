/**
 * COMPATIBILITY SHIM. B2B customers became Zepp D2C consumers — see
 * `consumers.ts` (the real source). This re-exports consumers under the old
 * `customers` names + a legacy-shaped `customerStats`, so existing pages keep
 * importing while they're migrated. New code should import from `./consumers`.
 */
import { CONSUMERS, findConsumer, type Consumer } from './consumers'
import { MOVEMENTS, isActive } from './movements'

export type Customer = Consumer
export const CUSTOMERS: Consumer[] = CONSUMERS
export const findCustomer = findConsumer

// ── Legacy tier API (no longer meaningful for D2C; kept so imports resolve) ──
export type AccountTier = 'enterprise' | 'business' | 'standard'
export const TIER_LABELS: Record<AccountTier, string> = {
  enterprise: 'Enterprise',
  business: 'Business',
  standard: 'Standard',
}
export const TIER_TONE: Record<AccountTier, 'success' | 'info' | 'muted'> = {
  enterprise: 'success',
  business: 'info',
  standard: 'muted',
}

export interface CustomerStats {
  total: number
  active: number
  delivered: number
  revenue: number
}

/** Legacy-shaped stats derived from the last-mile ledger. */
export function customerStats(id: string): CustomerStats {
  const rows = MOVEMENTS.filter((m) => m.leg === 'last-mile' && m.consumerId === id)
  return {
    total: rows.length,
    active: rows.filter(isActive).length,
    delivered: rows.filter((m) => m.status === 'delivered').length,
    revenue: rows.reduce((sum, m) => sum + m.costUsd, 0),
  }
}
