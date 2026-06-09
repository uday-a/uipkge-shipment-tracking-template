/**
 * Zepp lane catalogue. A lane is a recurring origin→destination corridor in
 * the network, in one of two tiers (mirroring the movement ledger):
 *   - transfer:  import warehouse → distribution center (bulk replenishment)
 *   - last-mile: distribution center → consumer metro (D2C delivery)
 *
 * Lanes key off the network location ids (`originId` / `destId`) so the live
 * load riding each lane is DERIVED from the movement ledger — it can never
 * drift from the source of truth. Hand-built, deterministic.
 */
import { MOVEMENTS, isActive, type MovementLeg } from './movements'

export type RouteStatus = 'active' | 'scheduled' | 'completed' | 'disrupted'

export interface Lane {
  id: string
  name: string
  leg: MovementLeg
  originId: string
  destId: string
  origin: string
  destination: string
  distanceKm: number
  avgHours: number
  status: RouteStatus
  stops: number
  driver?: string
  vehicle?: string
}

export const ROUTE_STATUS_LABELS: Record<RouteStatus, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  completed: 'Completed',
  disrupted: 'Disrupted',
}

export const ROUTE_STATUS_TONE: Record<RouteStatus, 'success' | 'info' | 'muted' | 'destructive'> = {
  active: 'info',
  scheduled: 'muted',
  completed: 'success',
  disrupted: 'destructive',
}

export const LANE_LEG_LABELS: Record<MovementLeg, string> = {
  transfer: 'WH → DC transfer',
  'last-mile': 'Last-mile metro',
}

export const ROUTES: Lane[] = [
  // ── Warehouse → DC transfer corridors (line-haul: semis / box-trucks) ─
  { id: 'LANE-LGB-LAX', name: 'West Coast Hub → Los Angeles DC', leg: 'transfer', originId: 'WH-LGB', destId: 'DC-LAX', origin: 'Long Beach, CA', destination: 'Los Angeles, CA', distanceKm: 40, avgHours: 1, status: 'active', stops: 1, driver: 'Grant Whitaker', vehicle: 'TRK-118' },
  { id: 'LANE-LGB-SFO', name: 'West Coast Hub → Bay Area DC', leg: 'transfer', originId: 'WH-LGB', destId: 'DC-SFO', origin: 'Long Beach, CA', destination: 'San Francisco, CA', distanceKm: 615, avgHours: 7, status: 'active', stops: 2, driver: 'Owen Fischer', vehicle: 'TRK-301' },
  { id: 'LANE-LGB-SEA', name: 'West Coast Hub → Seattle DC', leg: 'transfer', originId: 'WH-LGB', destId: 'DC-SEA', origin: 'Long Beach, CA', destination: 'Seattle, WA', distanceKm: 1830, avgHours: 19, status: 'active', stops: 3, driver: 'Travis Boone', vehicle: 'TRK-230' },
  { id: 'LANE-LGB-PHX', name: 'West Coast Hub → Phoenix DC', leg: 'transfer', originId: 'WH-LGB', destId: 'DC-PHX', origin: 'Long Beach, CA', destination: 'Phoenix, AZ', distanceKm: 600, avgHours: 6, status: 'active', stops: 2, driver: 'Roy Schaefer', vehicle: 'TRK-118B' },
  { id: 'LANE-LGB-DEN', name: 'West Coast Hub → Denver DC', leg: 'transfer', originId: 'WH-LGB', destId: 'DC-DEN', origin: 'Long Beach, CA', destination: 'Denver, CO', distanceKm: 1650, avgHours: 17, status: 'disrupted', stops: 4, driver: 'Amara Diallo', vehicle: 'TRK-240' },
  { id: 'LANE-EWR-JFK', name: 'East Coast Hub → New York DC', leg: 'transfer', originId: 'WH-EWR', destId: 'DC-JFK', origin: 'Newark, NJ', destination: 'New York, NY', distanceKm: 30, avgHours: 1, status: 'active', stops: 1, driver: 'Isabela Cruz', vehicle: 'TRK-214' },
  { id: 'LANE-EWR-BOS', name: 'East Coast Hub → Boston DC', leg: 'transfer', originId: 'WH-EWR', destId: 'DC-BOS', origin: 'Newark, NJ', destination: 'Boston, MA', distanceKm: 350, avgHours: 4, status: 'active', stops: 2, driver: 'Carlos Mendez', vehicle: 'TRK-211' },
  { id: 'LANE-EWR-ORD', name: 'East Coast Hub → Chicago DC', leg: 'transfer', originId: 'WH-EWR', destId: 'DC-ORD', origin: 'Newark, NJ', destination: 'Chicago, IL', distanceKm: 1270, avgHours: 13, status: 'active', stops: 4, driver: 'Tasha Okafor', vehicle: 'TRK-208' },
  { id: 'LANE-EWR-EWR', name: 'East Coast Hub → Newark City DC', leg: 'transfer', originId: 'WH-EWR', destId: 'DC-EWR', origin: 'Newark, NJ', destination: 'Newark, NJ', distanceKm: 15, avgHours: 1, status: 'scheduled', stops: 1 },
  { id: 'LANE-SAV-ATL', name: 'Southeast Hub → Atlanta DC', leg: 'transfer', originId: 'WH-SAV', destId: 'DC-ATL', origin: 'Savannah, GA', destination: 'Atlanta, GA', distanceKm: 400, avgHours: 4, status: 'active', stops: 2, driver: 'Greta Lindqvist', vehicle: 'TRK-220' },
  { id: 'LANE-SAV-MIA', name: 'Southeast Hub → Miami DC', leg: 'transfer', originId: 'WH-SAV', destId: 'DC-MIA', origin: 'Savannah, GA', destination: 'Miami, FL', distanceKm: 800, avgHours: 8, status: 'disrupted', stops: 3, driver: 'Greta Lindqvist', vehicle: 'TRK-220' },
  { id: 'LANE-SAV-DFW', name: 'Southeast Hub → Dallas DC', leg: 'transfer', originId: 'WH-SAV', destId: 'DC-DFW', origin: 'Savannah, GA', destination: 'Dallas, TX', distanceKm: 1470, avgHours: 15, status: 'scheduled', stops: 4 },

  // ── DC → consumer last-mile metros (cargo vans) ─────────────────────
  { id: 'LANE-LAX-METRO', name: 'Los Angeles DC → metro', leg: 'last-mile', originId: 'DC-LAX', destId: 'DC-LAX', origin: 'Los Angeles DC', destination: 'Greater LA', distanceKm: 45, avgHours: 1, status: 'active', stops: 6, driver: 'Marcus Bell', vehicle: 'VAN-114' },
  { id: 'LANE-SFO-METRO', name: 'Bay Area DC → metro', leg: 'last-mile', originId: 'DC-SFO', destId: 'DC-SFO', origin: 'Bay Area DC', destination: 'SF Bay Area', distanceKm: 70, avgHours: 2, status: 'active', stops: 7, driver: 'Leah Park', vehicle: 'VAN-121' },
  { id: 'LANE-SEA-METRO', name: 'Seattle DC → metro', leg: 'last-mile', originId: 'DC-SEA', destId: 'DC-SEA', origin: 'Seattle DC', destination: 'Greater Seattle', distanceKm: 50, avgHours: 1, status: 'disrupted', stops: 5, driver: 'Ruby Vance', vehicle: 'VAN-155' },
  { id: 'LANE-PHX-METRO', name: 'Phoenix DC → metro', leg: 'last-mile', originId: 'DC-PHX', destId: 'DC-PHX', origin: 'Phoenix DC', destination: 'Greater Phoenix', distanceKm: 55, avgHours: 1, status: 'active', stops: 4, driver: 'Eli Donovan', vehicle: 'VAN-140' },
  { id: 'LANE-JFK-METRO', name: 'New York DC → metro', leg: 'last-mile', originId: 'DC-JFK', destId: 'DC-JFK', origin: 'New York DC', destination: 'NYC metro', distanceKm: 60, avgHours: 2, status: 'active', stops: 8, driver: 'Devin Walsh', vehicle: 'VAN-102' },
  { id: 'LANE-ATL-METRO', name: 'Atlanta DC → metro', leg: 'last-mile', originId: 'DC-ATL', destId: 'DC-ATL', origin: 'Atlanta DC', destination: 'Greater Atlanta', distanceKm: 50, avgHours: 1, status: 'active', stops: 5, driver: 'Hannah Cole', vehicle: 'VAN-119' },
  { id: 'LANE-DFW-METRO', name: 'Dallas DC → metro', leg: 'last-mile', originId: 'DC-DFW', destId: 'DC-DFW', origin: 'Dallas DC', destination: 'DFW metroplex', distanceKm: 65, avgHours: 2, status: 'active', stops: 5, driver: 'Caleb Ortiz', vehicle: 'VAN-105' },
  { id: 'LANE-ORD-METRO', name: 'Chicago DC → metro', leg: 'last-mile', originId: 'DC-ORD', destId: 'DC-ORD', origin: 'Chicago DC', destination: 'Chicagoland', distanceKm: 55, avgHours: 2, status: 'active', stops: 6, driver: 'Noah Brennan', vehicle: 'VAN-150' },
]

export function findRoute(id: string): Lane | undefined {
  return ROUTES.find((r) => r.id === id)
}

/**
 * Count of active movements currently riding a lane, derived from the ledger.
 * A movement matches when its leg + origin + destination match the lane.
 * Last-mile lanes share an origin/dest DC, so we match on the originId only.
 */
export function routeLoad(id: string): number {
  const lane = findRoute(id)
  if (!lane) return 0
  return MOVEMENTS.filter((m) => {
    if (!isActive(m) || m.leg !== lane.leg) return false
    if (lane.leg === 'last-mile') return m.originId === lane.originId
    return m.originId === lane.originId && m.destId === lane.destId
  }).length
}
