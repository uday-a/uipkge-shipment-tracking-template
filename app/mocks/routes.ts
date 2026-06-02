/**
 * Mock lane / route catalogue. Route ids match the `route` field on
 * shipments. Hand-built, deterministic.
 */
import { SHIPMENTS } from './shipments'

export type RouteStatus = 'active' | 'scheduled' | 'completed' | 'disrupted'

export interface Lane {
  id: string
  name: string
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

export const ROUTES: Lane[] = [
  { id: 'RTE-LA-PHX', name: 'LA → Phoenix', origin: 'Los Angeles, CA', destination: 'Phoenix, AZ', distanceKm: 600, avgHours: 6, status: 'active', stops: 3, driver: 'Marcus Bell', vehicle: 'VAN-114' },
  { id: 'RTE-CHI-DEN', name: 'Chicago → Denver', origin: 'Chicago, IL', destination: 'Denver, CO', distanceKm: 1600, avgHours: 16, status: 'active', stops: 5, driver: 'Tasha Okafor', vehicle: 'TRK-208' },
  { id: 'RTE-BOS-NYC', name: 'Boston → New York', origin: 'Boston, MA', destination: 'New York, NY', distanceKm: 350, avgHours: 4, status: 'disrupted', stops: 2, driver: 'Devin Walsh', vehicle: 'VAN-102' },
  { id: 'RTE-DFW-IAH', name: 'Dallas → Houston', origin: 'Dallas, TX', destination: 'Houston, TX', distanceKm: 385, avgHours: 4, status: 'active', stops: 2, driver: 'Carlos Mendez', vehicle: 'TRK-211' },
  { id: 'RTE-DTW-ATL', name: 'Detroit → Atlanta', origin: 'Detroit, MI', destination: 'Atlanta, GA', distanceKm: 1150, avgHours: 12, status: 'disrupted', stops: 4, driver: 'Priya Nair', vehicle: 'TRK-305' },
  { id: 'RTE-MIA-ATL', name: 'Miami → Atlanta', origin: 'Miami, FL', destination: 'Atlanta, GA', distanceKm: 1050, avgHours: 11, status: 'active', stops: 4, driver: 'Hannah Cole', vehicle: 'VAN-119' },
  { id: 'RTE-SEA-PDX', name: 'Seattle → Portland', origin: 'Seattle, WA', destination: 'Portland, OR', distanceKm: 280, avgHours: 3, status: 'active', stops: 2, driver: 'Owen Fischer', vehicle: 'TRK-301' },
  { id: 'RTE-NYC-BOS', name: 'New York → Boston', origin: 'New York, NY', destination: 'Boston, MA', distanceKm: 350, avgHours: 4, status: 'active', stops: 2, driver: 'Devin Walsh', vehicle: 'VAN-102' },
  { id: 'RTE-MCI-MSP', name: 'Kansas City → Minneapolis', origin: 'Kansas City, MO', destination: 'Minneapolis, MN', distanceKm: 700, avgHours: 7, status: 'active', stops: 3, driver: 'Greta Lindqvist', vehicle: 'TRK-220' },
  { id: 'RTE-PHX-LA', name: 'Phoenix → LA', origin: 'Phoenix, AZ', destination: 'Los Angeles, CA', distanceKm: 600, avgHours: 6, status: 'scheduled', stops: 3, driver: 'Marcus Bell', vehicle: 'TRK-118' },
  { id: 'RTE-CHI-MCI', name: 'Chicago → Kansas City', origin: 'Chicago, IL', destination: 'Kansas City, MO', distanceKm: 800, avgHours: 8, status: 'scheduled', stops: 3, driver: 'Tasha Okafor', vehicle: 'TRK-208' },
  { id: 'RTE-NYC-CHI', name: 'New York → Chicago', origin: 'New York, NY', destination: 'Chicago, IL', distanceKm: 1270, avgHours: 13, status: 'active', stops: 5, driver: 'Isabela Cruz', vehicle: 'TRK-214' },
  { id: 'RTE-SEA-DEN', name: 'Seattle → Denver', origin: 'Seattle, WA', destination: 'Denver, CO', distanceKm: 2050, avgHours: 21, status: 'disrupted', stops: 6, driver: 'Owen Fischer', vehicle: 'TRK-309' },
  { id: 'RTE-LA-SFO', name: 'LA → San Francisco', origin: 'Los Angeles, CA', destination: 'San Francisco, CA', distanceKm: 615, avgHours: 6, status: 'active', stops: 3, driver: 'Leah Park', vehicle: 'VAN-121' },
  { id: 'RTE-SFO-OAK', name: 'SF → Oakland metro', origin: 'San Francisco, CA', destination: 'Oakland, CA', distanceKm: 20, avgHours: 1, status: 'active', stops: 4, driver: 'Leah Park', vehicle: 'VAN-121' },
  { id: 'RTE-PHX-DEN', name: 'Phoenix → Denver', origin: 'Phoenix, AZ', destination: 'Denver, CO', distanceKm: 950, avgHours: 10, status: 'completed', stops: 4, driver: 'Owen Fischer', vehicle: 'TRK-309' },
]

export function findRoute(id: string): Lane | undefined {
  return ROUTES.find((r) => r.id === id)
}

/** Count of active shipments currently riding a lane. */
export function routeLoad(id: string): number {
  return SHIPMENTS.filter((s) => s.route === id && !['delivered', 'returned'].includes(s.status)).length
}
