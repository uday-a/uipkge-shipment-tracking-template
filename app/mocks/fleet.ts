/**
 * Mock vehicle fleet. Vehicle ids match the `vehicle` field on movements +
 * the `vehicle` field on drivers. Hand-built, deterministic.
 *
 * Two tiers, mirroring the movement legs + driver pools:
 *   - cargo vans → last-mile (DC → consumer)
 *   - box-trucks / semis → line-haul (WH → DC transfers)
 * Each active vehicle carries exactly the driver the ledger has on its current
 * active movement (1 driver ↔ 1 vehicle ↔ 1 movement); two are sidelined for
 * service. Driver names + assignments stay in lock-step with drivers.ts.
 */
export type VehicleType = 'van' | 'box-truck' | 'semi'
export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'loading'

export interface Vehicle {
  id: string
  plate: string
  type: VehicleType
  status: VehicleStatus
  driver?: string
  capacityKg: number
  loadKg: number
  location: string
  odometerKm: number
  fuelPct: number
  nextServiceKm: number
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  van: 'Cargo van',
  'box-truck': 'Box truck',
  semi: 'Semi trailer',
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  active: 'On route',
  idle: 'Idle',
  maintenance: 'Maintenance',
  loading: 'Loading',
}

export const VEHICLE_STATUS_TONE: Record<VehicleStatus, 'success' | 'info' | 'warning' | 'muted'> = {
  active: 'info',
  idle: 'muted',
  maintenance: 'warning',
  loading: 'success',
}

export const VEHICLE_TYPES: VehicleType[] = ['van', 'box-truck', 'semi']
export const VEHICLE_STATUSES: VehicleStatus[] = ['active', 'idle', 'maintenance', 'loading']

export const VEHICLES: Vehicle[] = [
  // ── Cargo vans — last-mile fleet (DC → consumer) ────────────────────
  { id: 'VAN-114', plate: 'CA-9056', type: 'van', status: 'active', driver: 'Marcus Bell', capacityKg: 1000, loadKg: 22, location: 'Los Angeles, CA', odometerKm: 67400, fuelPct: 48, nextServiceKm: 70000 },
  { id: 'VAN-121', plate: 'CA-4413', type: 'van', status: 'active', driver: 'Leah Park', capacityKg: 900, loadKg: 26, location: 'Daly City, CA', odometerKm: 28600, fuelPct: 69, nextServiceKm: 32000 },
  { id: 'VAN-155', plate: 'OR-7782', type: 'van', status: 'active', driver: 'Ruby Vance', capacityKg: 900, loadKg: 30, location: 'Tacoma, WA', odometerKm: 8800, fuelPct: 78, nextServiceKm: 12000 },
  { id: 'VAN-140', plate: 'CO-1902', type: 'van', status: 'active', driver: 'Eli Donovan', capacityKg: 1000, loadKg: 34, location: 'Aurora, CO', odometerKm: 44100, fuelPct: 55, nextServiceKm: 48000 },
  { id: 'VAN-102', plate: 'MA-7741', type: 'van', status: 'active', driver: 'Devin Walsh', capacityKg: 1200, loadKg: 26, location: 'Cambridge, MA', odometerKm: 84200, fuelPct: 62, nextServiceKm: 88000 },
  { id: 'VAN-119', plate: 'FL-2288', type: 'van', status: 'active', driver: 'Hannah Cole', capacityKg: 1000, loadKg: 30, location: 'Decatur, GA', odometerKm: 39900, fuelPct: 81, nextServiceKm: 44000 },
  { id: 'VAN-105', plate: 'TX-3120', type: 'van', status: 'active', driver: 'Caleb Ortiz', capacityKg: 1000, loadKg: 34, location: 'Irving, TX', odometerKm: 51800, fuelPct: 74, nextServiceKm: 56000 },
  { id: 'VAN-130', plate: 'CA-6677', type: 'van', status: 'active', driver: 'Maya Sullivan', capacityKg: 900, loadKg: 22, location: 'Sunnyvale, CA', odometerKm: 19200, fuelPct: 90, nextServiceKm: 24000 },
  { id: 'VAN-150', plate: 'IL-2231', type: 'van', status: 'active', driver: 'Noah Brennan', capacityKg: 1000, loadKg: 26, location: 'Chicago, IL', odometerKm: 12400, fuelPct: 95, nextServiceKm: 16000 },

  // ── Box-trucks / semis — line-haul fleet (WH → DC) ──────────────────
  { id: 'TRK-118', plate: 'CA-5530', type: 'box-truck', status: 'active', driver: 'Grant Whitaker', capacityKg: 6000, loadKg: 2100, location: 'Los Angeles, CA', odometerKm: 121400, fuelPct: 41, nextServiceKm: 124000 },
  { id: 'TRK-301', plate: 'WA-2056', type: 'semi', status: 'active', driver: 'Owen Fischer', capacityKg: 20000, loadKg: 1900, location: 'Santa Maria, CA', odometerKm: 254100, fuelPct: 50, nextServiceKm: 256000 },
  { id: 'TRK-230', plate: 'GA-7715', type: 'semi', status: 'active', driver: 'Travis Boone', capacityKg: 20000, loadKg: 1670, location: 'Redding, CA', odometerKm: 88400, fuelPct: 72, nextServiceKm: 92000 },
  { id: 'TRK-240', plate: 'CO-9904', type: 'semi', status: 'active', driver: 'Amara Diallo', capacityKg: 20000, loadKg: 1320, location: 'Grand Junction, CO', odometerKm: 96300, fuelPct: 66, nextServiceKm: 100000 },
  { id: 'TRK-214', plate: 'NY-9921', type: 'semi', status: 'active', driver: 'Isabela Cruz', capacityKg: 18000, loadKg: 2070, location: 'Jersey City, NJ', odometerKm: 198300, fuelPct: 35, nextServiceKm: 200000 },
  { id: 'TRK-208', plate: 'IL-8841', type: 'semi', status: 'active', driver: 'Tasha Okafor', capacityKg: 18000, loadKg: 1630, location: 'Macon, GA', odometerKm: 286500, fuelPct: 58, nextServiceKm: 290000 },
  { id: 'TRK-220', plate: 'MO-4408', type: 'box-truck', status: 'active', driver: 'Greta Lindqvist', capacityKg: 8000, loadKg: 1670, location: 'Jacksonville, FL', odometerKm: 142900, fuelPct: 63, nextServiceKm: 146000 },
  { id: 'TRK-211', plate: 'TX-3367', type: 'semi', status: 'active', driver: 'Carlos Mendez', capacityKg: 20000, loadKg: 1800, location: 'Newark, NJ', odometerKm: 312700, fuelPct: 47, nextServiceKm: 316000 },
  { id: 'TRK-118B', plate: 'UT-1147', type: 'box-truck', status: 'active', driver: 'Roy Schaefer', capacityKg: 6000, loadKg: 1360, location: 'Green River, UT', odometerKm: 60100, fuelPct: 88, nextServiceKm: 64000 },

  // ── Spares — idle at the yard / being loaded, awaiting a driver ─────
  { id: 'VAN-160', plate: 'CA-7012', type: 'van', status: 'idle', capacityKg: 1000, loadKg: 0, location: 'Long Beach yard', odometerKm: 9100, fuelPct: 84, nextServiceKm: 12000 },
  { id: 'VAN-165', plate: 'NJ-4458', type: 'van', status: 'loading', capacityKg: 1000, loadKg: 160, location: 'Newark City DC dock', odometerKm: 14300, fuelPct: 77, nextServiceKm: 18000 },

  // ── In for service ──────────────────────────────────────────────────
  { id: 'TRK-305', plate: 'MI-6634', type: 'semi', status: 'maintenance', driver: 'Priya Nair', capacityKg: 20000, loadKg: 0, location: 'Nashville, TN depot', odometerKm: 330800, fuelPct: 28, nextServiceKm: 331000 },
  { id: 'TRK-309', plate: 'WA-8890', type: 'box-truck', status: 'maintenance', capacityKg: 8000, loadKg: 0, location: 'Seattle service center', odometerKm: 176200, fuelPct: 15, nextServiceKm: 176500 },
]

export function findVehicle(id: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.id === id)
}
