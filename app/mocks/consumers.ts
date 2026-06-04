/**
 * Zepp D2C consumers — the end users a distribution center delivers to.
 * Replaces the old B2B `customers.ts`. Hand-built, deterministic.
 *
 * `assignedDcId` is the nearest distribution center that fulfils this
 * consumer's last-mile order; `orderedSku` is the bike they bought.
 * Order/delivery stats are derived from the last-mile movement ledger so
 * they never drift from the source of truth.
 */
import { MOVEMENTS, isActive } from './movements'

export interface Consumer {
  id: string
  name: string
  initials: string
  email: string
  phone: string
  address: string
  city: string
  assignedDcId: string
  orderedSku: string
  since: string // ISO yyyy-mm-dd — first order
}

export const CONSUMERS: Consumer[] = [
  { id: 'CON-001', name: 'Daniel Reyes', initials: 'DR', email: 'daniel.reyes@mail.example', phone: '+1 213-555-0142', address: '482 Maple Ave', city: 'Los Angeles, CA', assignedDcId: 'DC-LAX', orderedSku: 'ZB-CITY', since: '2026-05-22' },
  { id: 'CON-002', name: 'Emily Carter', initials: 'EC', email: 'emily.carter@mail.example', phone: '+1 415-555-0188', address: '17 Larkin St', city: 'San Francisco, CA', assignedDcId: 'DC-SFO', orderedSku: 'ZB-PRO', since: '2026-05-20' },
  { id: 'CON-003', name: 'Nathan Brooks', initials: 'NB', email: 'nathan.brooks@mail.example', phone: '+1 206-555-0119', address: '903 Pine St', city: 'Seattle, WA', assignedDcId: 'DC-SEA', orderedSku: 'ZB-TRAIL', since: '2026-05-18' },
  { id: 'CON-004', name: 'Olivia Hayes', initials: 'OH', email: 'olivia.hayes@mail.example', phone: '+1 602-555-0173', address: '256 Camelback Rd', city: 'Phoenix, AZ', assignedDcId: 'DC-PHX', orderedSku: 'ZB-LITE', since: '2026-05-25' },
  { id: 'CON-005', name: 'Ryan Mitchell', initials: 'RM', email: 'ryan.mitchell@mail.example', phone: '+1 720-555-0167', address: '88 Larimer St', city: 'Denver, CO', assignedDcId: 'DC-DEN', orderedSku: 'ZB-CARGO', since: '2026-05-19' },
  { id: 'CON-006', name: 'Sophia Bennett', initials: 'SB', email: 'sophia.bennett@mail.example', phone: '+1 212-555-0124', address: '441 Bleecker St', city: 'New York, NY', assignedDcId: 'DC-JFK', orderedSku: 'ZB-FOLD', since: '2026-05-24' },
  { id: 'CON-007', name: 'Ethan Sullivan', initials: 'ES', email: 'ethan.sullivan@mail.example', phone: '+1 617-555-0156', address: '62 Beacon St', city: 'Boston, MA', assignedDcId: 'DC-BOS', orderedSku: 'ZB-PRO', since: '2026-05-21' },
  { id: 'CON-008', name: 'Grace Coleman', initials: 'GC', email: 'grace.coleman@mail.example', phone: '+1 312-555-0133', address: '210 Wacker Dr', city: 'Chicago, IL', assignedDcId: 'DC-ORD', orderedSku: 'ZB-CITY', since: '2026-05-23' },
  { id: 'CON-009', name: 'Lucas Foster', initials: 'LF', email: 'lucas.foster@mail.example', phone: '+1 973-555-0191', address: '15 Market St', city: 'Newark, NJ', assignedDcId: 'DC-EWR', orderedSku: 'ZB-LITE', since: '2026-05-26' },
  { id: 'CON-010', name: 'Chloe Morgan', initials: 'CM', email: 'chloe.morgan@mail.example', phone: '+1 404-555-0148', address: '730 Peachtree St', city: 'Atlanta, GA', assignedDcId: 'DC-ATL', orderedSku: 'ZB-TRAIL', since: '2026-05-17' },
  { id: 'CON-011', name: 'Mason Rivera', initials: 'MR', email: 'mason.rivera@mail.example', phone: '+1 305-555-0162', address: '54 Ocean Dr', city: 'Miami, FL', assignedDcId: 'DC-MIA', orderedSku: 'ZB-CITY', since: '2026-05-27' },
  { id: 'CON-012', name: 'Ava Richardson', initials: 'AR', email: 'ava.richardson@mail.example', phone: '+1 214-555-0177', address: '319 Elm St', city: 'Dallas, TX', assignedDcId: 'DC-DFW', orderedSku: 'ZB-CARGO', since: '2026-05-22' },
  { id: 'CON-013', name: 'Henry Parker', initials: 'HP', email: 'henry.parker@mail.example', phone: '+1 323-555-0151', address: '127 Sunset Blvd', city: 'Los Angeles, CA', assignedDcId: 'DC-LAX', orderedSku: 'ZB-PRO', since: '2026-05-15' },
  { id: 'CON-014', name: 'Isla Murphy', initials: 'IM', email: 'isla.murphy@mail.example', phone: '+1 408-555-0139', address: '90 First St', city: 'San Jose, CA', assignedDcId: 'DC-SFO', orderedSku: 'ZB-CITY', since: '2026-05-28' },
  { id: 'CON-015', name: 'Owen Clarke', initials: 'OC', email: 'owen.clarke@mail.example', phone: '+1 646-555-0183', address: '305 Hudson St', city: 'New York, NY', assignedDcId: 'DC-JFK', orderedSku: 'ZB-TRAIL', since: '2026-05-16' },
  { id: 'CON-016', name: 'Mia Thompson', initials: 'MT', email: 'mia.thompson@mail.example', phone: '+1 773-555-0129', address: '612 Halsted St', city: 'Chicago, IL', assignedDcId: 'DC-ORD', orderedSku: 'ZB-PRO', since: '2026-05-26' },
]

const BY_ID: Record<string, Consumer> = Object.fromEntries(CONSUMERS.map((c) => [c.id, c]))

export function findConsumer(id: string): Consumer | undefined {
  return BY_ID[id]
}

/** Consumer display name for an id (falls back to the raw id). */
export function consumerName(id: string): string {
  return BY_ID[id]?.name ?? id
}

export interface ConsumerStats {
  orders: number
  delivered: number
  active: number
  spendUsd: number
}

/** Derive a consumer's order/delivery stats from the last-mile ledger. */
export function consumerStats(id: string): ConsumerStats {
  const rows = MOVEMENTS.filter((m) => m.leg === 'last-mile' && m.consumerId === id)
  return {
    orders: rows.length,
    delivered: rows.filter((m) => m.status === 'delivered').length,
    active: rows.filter(isActive).length,
    spendUsd: rows.reduce((sum, m) => sum + m.valueUsd, 0),
  }
}
