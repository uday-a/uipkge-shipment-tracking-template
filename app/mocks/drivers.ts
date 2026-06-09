/**
 * Mock driver roster. Names match the `driver` field on movements so the
 * detail / dashboard / fleet surfaces cross-link. Hand-built, deterministic.
 *
 * Two disjoint pools, mirroring the two movement legs (a driver works one):
 *   - line-haul: WH → DC transfers, on semis / box-trucks (CDL-A)
 *   - last-mile: DC → consumer deliveries, in cargo vans (CDL-A/B)
 * The roster is sized to the fleet (≈one driver per vehicle) so every active
 * movement maps to a unique driver + vehicle — no driver is ever on two
 * concurrent active movements. Each driver's `vehicle` matches fleet.ts.
 */
import { SHIPMENTS } from './shipments'

export type DriverStatus = 'on-route' | 'available' | 'off-duty' | 'on-break'

export interface Driver {
  id: string
  name: string
  initials: string
  status: DriverStatus
  phone: string
  homeBase: string
  vehicle?: string
  license: string
  rating: number // 0-5
  deliveriesToday: number
  onTimeRate: number // percent
  yearsActive: number
}

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  'on-route': 'On route',
  available: 'Available',
  'off-duty': 'Off duty',
  'on-break': 'On break',
}

export const DRIVER_STATUS_TONE: Record<DriverStatus, 'success' | 'info' | 'warning' | 'muted'> = {
  'on-route': 'info',
  available: 'success',
  'off-duty': 'muted',
  'on-break': 'warning',
}

export const DRIVERS: Driver[] = [
  // ── Last-mile pool (cargo vans, DC → consumer) ──────────────────────
  { id: 'DRV-01', name: 'Marcus Bell', initials: 'MB', status: 'on-route', phone: '+1 213-555-0101', homeBase: 'Los Angeles, CA', vehicle: 'VAN-114', license: 'CDL-B', rating: 4.8, deliveriesToday: 7, onTimeRate: 96, yearsActive: 6 },
  // ── Line-haul pool (semis / box-trucks, WH → DC) ────────────────────
  { id: 'DRV-02', name: 'Tasha Okafor', initials: 'TO', status: 'on-route', phone: '+1 312-555-0102', homeBase: 'Chicago, IL', vehicle: 'TRK-208', license: 'CDL-A', rating: 4.9, deliveriesToday: 2, onTimeRate: 98, yearsActive: 9 },
  { id: 'DRV-03', name: 'Devin Walsh', initials: 'DW', status: 'on-route', phone: '+1 617-555-0103', homeBase: 'Boston, MA', vehicle: 'VAN-102', license: 'CDL-B', rating: 4.7, deliveriesToday: 5, onTimeRate: 94, yearsActive: 4 },
  { id: 'DRV-04', name: 'Carlos Mendez', initials: 'CM', status: 'on-route', phone: '+1 214-555-0104', homeBase: 'Dallas, TX', vehicle: 'TRK-211', license: 'CDL-A', rating: 4.6, deliveriesToday: 2, onTimeRate: 91, yearsActive: 11 },
  { id: 'DRV-05', name: 'Priya Nair', initials: 'PN', status: 'on-break', phone: '+1 313-555-0105', homeBase: 'Detroit, MI', vehicle: 'TRK-305', license: 'CDL-A', rating: 4.5, deliveriesToday: 1, onTimeRate: 88, yearsActive: 7 },
  { id: 'DRV-06', name: 'Hannah Cole', initials: 'HC', status: 'on-route', phone: '+1 305-555-0106', homeBase: 'Miami, FL', vehicle: 'VAN-119', license: 'CDL-B', rating: 4.8, deliveriesToday: 6, onTimeRate: 95, yearsActive: 5 },
  { id: 'DRV-07', name: 'Owen Fischer', initials: 'OF', status: 'on-route', phone: '+1 206-555-0107', homeBase: 'Seattle, WA', vehicle: 'TRK-301', license: 'CDL-A', rating: 4.4, deliveriesToday: 2, onTimeRate: 86, yearsActive: 3 },
  { id: 'DRV-08', name: 'Leah Park', initials: 'LP', status: 'on-route', phone: '+1 415-555-0108', homeBase: 'San Francisco, CA', vehicle: 'VAN-121', license: 'CDL-B', rating: 4.9, deliveriesToday: 9, onTimeRate: 97, yearsActive: 8 },
  { id: 'DRV-09', name: 'Greta Lindqvist', initials: 'GL', status: 'on-route', phone: '+1 816-555-0109', homeBase: 'Kansas City, MO', vehicle: 'TRK-220', license: 'CDL-A', rating: 4.7, deliveriesToday: 2, onTimeRate: 93, yearsActive: 10 },
  { id: 'DRV-10', name: 'Isabela Cruz', initials: 'IC', status: 'on-route', phone: '+1 212-555-0110', homeBase: 'New York, NY', vehicle: 'TRK-214', license: 'CDL-A', rating: 4.6, deliveriesToday: 2, onTimeRate: 90, yearsActive: 6 },
  { id: 'DRV-11', name: 'Noah Brennan', initials: 'NB', status: 'on-route', phone: '+1 312-555-0111', homeBase: 'Chicago, IL', vehicle: 'VAN-150', license: 'CDL-B', rating: 4.5, deliveriesToday: 5, onTimeRate: 92, yearsActive: 2 },
  { id: 'DRV-12', name: 'Amara Diallo', initials: 'AD', status: 'on-route', phone: '+1 720-555-0112', homeBase: 'Denver, CO', vehicle: 'TRK-240', license: 'CDL-A', rating: 4.8, deliveriesToday: 2, onTimeRate: 96, yearsActive: 5 },
  { id: 'DRV-13', name: 'Wesley Tran', initials: 'WT', status: 'available', phone: '+1 503-555-0113', homeBase: 'Portland, OR', license: 'CDL-A', rating: 4.3, deliveriesToday: 0, onTimeRate: 85, yearsActive: 1 },
  { id: 'DRV-14', name: 'Sofia Marino', initials: 'SM', status: 'off-duty', phone: '+1 713-555-0114', homeBase: 'Houston, TX', license: 'CDL-A', rating: 4.7, deliveriesToday: 0, onTimeRate: 94, yearsActive: 7 },
  // ── Added so the roster matches the fleet (one driver per active vehicle) ──
  { id: 'DRV-15', name: 'Grant Whitaker', initials: 'GW', status: 'on-route', phone: '+1 562-555-0115', homeBase: 'Long Beach, CA', vehicle: 'TRK-118', license: 'CDL-A', rating: 4.7, deliveriesToday: 2, onTimeRate: 95, yearsActive: 8 },
  { id: 'DRV-16', name: 'Travis Boone', initials: 'TB', status: 'on-route', phone: '+1 916-555-0116', homeBase: 'Sacramento, CA', vehicle: 'TRK-230', license: 'CDL-A', rating: 4.6, deliveriesToday: 1, onTimeRate: 92, yearsActive: 6 },
  { id: 'DRV-17', name: 'Roy Schaefer', initials: 'RS', status: 'on-route', phone: '+1 801-555-0117', homeBase: 'Salt Lake City, UT', vehicle: 'TRK-118B', license: 'CDL-A', rating: 4.5, deliveriesToday: 1, onTimeRate: 89, yearsActive: 4 },
  { id: 'DRV-18', name: 'Caleb Ortiz', initials: 'CO', status: 'on-route', phone: '+1 469-555-0118', homeBase: 'Dallas, TX', vehicle: 'VAN-105', license: 'CDL-B', rating: 4.8, deliveriesToday: 6, onTimeRate: 96, yearsActive: 5 },
  { id: 'DRV-19', name: 'Maya Sullivan', initials: 'MS', status: 'on-route', phone: '+1 408-555-0119', homeBase: 'San Jose, CA', vehicle: 'VAN-130', license: 'CDL-B', rating: 4.7, deliveriesToday: 5, onTimeRate: 94, yearsActive: 4 },
  { id: 'DRV-20', name: 'Eli Donovan', initials: 'ED', status: 'on-route', phone: '+1 303-555-0120', homeBase: 'Denver, CO', vehicle: 'VAN-140', license: 'CDL-B', rating: 4.6, deliveriesToday: 4, onTimeRate: 91, yearsActive: 3 },
  { id: 'DRV-21', name: 'Ruby Vance', initials: 'RV', status: 'on-route', phone: '+1 425-555-0121', homeBase: 'Seattle, WA', vehicle: 'VAN-155', license: 'CDL-B', rating: 4.8, deliveriesToday: 7, onTimeRate: 97, yearsActive: 6 },
]

export function findDriver(id: string): Driver | undefined {
  return DRIVERS.find((d) => d.id === id || d.name === id)
}

/** Count of active shipments currently assigned to a driver. */
export function driverActiveLoad(name: string): number {
  return SHIPMENTS.filter((s) => s.driver === name && !['delivered', 'returned'].includes(s.status)).length
}
