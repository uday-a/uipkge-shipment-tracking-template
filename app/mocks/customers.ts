/**
 * Mock customer accounts. IDs match `customerId` on shipments so the
 * customer page can derive live shipment counts from the shipment ledger
 * rather than carrying drifting hardcoded totals.
 */
import { SHIPMENTS, isActive } from './shipments'

export type AccountTier = 'enterprise' | 'business' | 'standard'

export interface Customer {
  id: string
  name: string
  initials: string
  contact: string
  email: string
  phone: string
  city: string
  tier: AccountTier
  since: string // ISO yyyy-mm-dd
  onTimeRate: number // percent
}

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

export const CUSTOMERS: Customer[] = [
  { id: 'CUS-001', name: 'Nordwind Retail Group', initials: 'NR', contact: 'Erika Sandberg', email: 'logistics@nordwind.example', phone: '+1 312-555-0142', city: 'Chicago, IL', tier: 'enterprise', since: '2021-03-11', onTimeRate: 96 },
  { id: 'CUS-002', name: 'Meridian Electronics', initials: 'ME', contact: 'Daniel Pruitt', email: 'ship@meridian-e.example', phone: '+1 212-555-0188', city: 'New York, NY', tier: 'enterprise', since: '2020-09-02', onTimeRate: 94 },
  { id: 'CUS-003', name: 'Sunbelt Grocers', initials: 'SG', contact: 'Maria Delgado', email: 'ops@sunbelt.example', phone: '+1 214-555-0119', city: 'Dallas, TX', tier: 'business', since: '2022-01-20', onTimeRate: 92 },
  { id: 'CUS-004', name: 'Atlas Pharma', initials: 'AP', contact: 'Dr. Helen Voss', email: 'distribution@atlaspharma.example', phone: '+1 617-555-0173', city: 'Boston, MA', tier: 'enterprise', since: '2019-11-14', onTimeRate: 98 },
  { id: 'CUS-005', name: 'Vertex Auto Parts', initials: 'VA', contact: 'Raymond Hughes', email: 'freight@vertexauto.example', phone: '+1 313-555-0167', city: 'Detroit, MI', tier: 'business', since: '2021-07-30', onTimeRate: 89 },
  { id: 'CUS-006', name: 'Coastal Apparel Co.', initials: 'CA', contact: 'Bianca Ferreira', email: 'shipping@coastalapparel.example', phone: '+1 305-555-0124', city: 'Miami, FL', tier: 'standard', since: '2023-02-08', onTimeRate: 90 },
  { id: 'CUS-007', name: 'Granite Construction Supply', initials: 'GC', contact: 'Theo Brandt', email: 'dispatch@granitesupply.example', phone: '+1 206-555-0156', city: 'Seattle, WA', tier: 'business', since: '2022-05-19', onTimeRate: 87 },
  { id: 'CUS-008', name: 'BlueLeaf Organics', initials: 'BL', contact: 'Nina Castellano', email: 'deliveries@blueleaf.example', phone: '+1 415-555-0133', city: 'San Francisco, CA', tier: 'standard', since: '2023-06-25', onTimeRate: 93 },
  { id: 'CUS-009', name: 'Pinnacle Medical', initials: 'PM', contact: 'Aaron Whitfield', email: 'supplychain@pinnaclemed.example', phone: '+1 646-555-0191', city: 'New York, NY', tier: 'enterprise', since: '2020-04-17', onTimeRate: 97 },
  { id: 'CUS-010', name: 'Horizon Furniture', initials: 'HF', contact: 'Lottie Grant', email: 'freight@horizonfurniture.example', phone: '+1 816-555-0148', city: 'Kansas City, MO', tier: 'business', since: '2022-10-03', onTimeRate: 88 },
  { id: 'CUS-011', name: 'Quantum Components', initials: 'QC', contact: 'Sven Aaltonen', email: 'logistics@quantumc.example', phone: '+1 602-555-0162', city: 'Phoenix, AZ', tier: 'enterprise', since: '2019-08-29', onTimeRate: 95 },
  { id: 'CUS-012', name: 'Evergreen Foods', initials: 'EF', contact: 'Grace Mitchell', email: 'shipping@evergreenfoods.example', phone: '+1 503-555-0177', city: 'Portland, OR', tier: 'standard', since: '2023-09-12', onTimeRate: 91 },
]

export function findCustomer(id: string): Customer | undefined {
  return CUSTOMERS.find((c) => c.id === id)
}

export interface CustomerStats {
  total: number
  active: number
  delivered: number
  revenue: number
}

/** Derive shipment stats for a customer from the shipment ledger. */
export function customerStats(id: string): CustomerStats {
  const rows = SHIPMENTS.filter((s) => s.customerId === id)
  return {
    total: rows.length,
    active: rows.filter(isActive).length,
    delivered: rows.filter((s) => s.status === 'delivered').length,
    revenue: rows.reduce((sum, s) => sum + s.costUsd, 0),
  }
}
