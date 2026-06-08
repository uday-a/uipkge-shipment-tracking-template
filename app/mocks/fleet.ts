/**
 * Mock vehicle fleet. Vehicle ids match the `vehicle` field on shipments
 * + the `vehicle` field on drivers. Hand-built, deterministic.
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
  { id: 'VAN-102', plate: 'MA-7741', type: 'van', status: 'active', driver: 'Devin Walsh', capacityKg: 1200, loadKg: 38, location: 'Hartford, CT', odometerKm: 84200, fuelPct: 62, nextServiceKm: 88000 },
  { id: 'VAN-105', plate: 'NY-3120', type: 'van', status: 'idle', capacityKg: 1000, loadKg: 0, location: 'Newark City DC', odometerKm: 51800, fuelPct: 74, nextServiceKm: 56000 },
  { id: 'VAN-114', plate: 'CA-9056', type: 'van', status: 'active', driver: 'Marcus Bell', capacityKg: 1000, loadKg: 84, location: 'Phoenix, AZ', odometerKm: 67400, fuelPct: 48, nextServiceKm: 70000 },
  { id: 'VAN-119', plate: 'FL-2288', type: 'van', status: 'active', driver: 'Hannah Cole', capacityKg: 1000, loadKg: 180, location: 'Gainesville, FL', odometerKm: 39900, fuelPct: 81, nextServiceKm: 44000 },
  { id: 'VAN-121', plate: 'CA-4413', type: 'van', status: 'active', driver: 'Leah Park', capacityKg: 900, loadKg: 52, location: 'Oakland, CA', odometerKm: 28600, fuelPct: 69, nextServiceKm: 32000 },
  { id: 'VAN-130', plate: 'IL-6677', type: 'van', status: 'idle', capacityKg: 900, loadKg: 0, location: 'Chicago DC', odometerKm: 19200, fuelPct: 90, nextServiceKm: 24000 },
  { id: 'VAN-140', plate: 'CO-1902', type: 'van', status: 'idle', capacityKg: 1000, loadKg: 0, location: 'Denver DC', odometerKm: 44100, fuelPct: 55, nextServiceKm: 48000 },
  { id: 'TRK-118', plate: 'AZ-5530', type: 'box-truck', status: 'idle', capacityKg: 6000, loadKg: 0, location: 'Los Angeles DC yard', odometerKm: 121400, fuelPct: 41, nextServiceKm: 124000 },
  { id: 'TRK-208', plate: 'IL-8841', type: 'semi', status: 'active', driver: 'Tasha Okafor', capacityKg: 18000, loadKg: 1240, location: 'Lincoln, NE', odometerKm: 286500, fuelPct: 58, nextServiceKm: 290000 },
  { id: 'TRK-211', plate: 'TX-3367', type: 'semi', status: 'active', driver: 'Carlos Mendez', capacityKg: 20000, loadKg: 4200, location: 'Huntsville, TX', odometerKm: 312700, fuelPct: 47, nextServiceKm: 316000 },
  { id: 'TRK-214', plate: 'NY-9921', type: 'semi', status: 'active', driver: 'Isabela Cruz', capacityKg: 18000, loadKg: 5800, location: 'Gary, IN', odometerKm: 198300, fuelPct: 35, nextServiceKm: 200000 },
  { id: 'TRK-220', plate: 'MO-4408', type: 'box-truck', status: 'idle', driver: 'Greta Lindqvist', capacityKg: 8000, loadKg: 0, location: 'Kansas City yard', odometerKm: 142900, fuelPct: 63, nextServiceKm: 146000 },
  { id: 'TRK-230', plate: 'GA-7715', type: 'semi', status: 'idle', capacityKg: 20000, loadKg: 0, location: 'Savannah Import Hub', odometerKm: 88400, fuelPct: 72, nextServiceKm: 92000 },
  { id: 'TRK-301', plate: 'WA-2056', type: 'semi', status: 'active', driver: 'Owen Fischer', capacityKg: 20000, loadKg: 8800, location: 'Olympia, WA', odometerKm: 254100, fuelPct: 50, nextServiceKm: 256000 },
  { id: 'TRK-305', plate: 'MI-6634', type: 'semi', status: 'maintenance', driver: 'Priya Nair', capacityKg: 20000, loadKg: 0, location: 'Nashville, TN depot', odometerKm: 330800, fuelPct: 28, nextServiceKm: 331000 },
  { id: 'TRK-309', plate: 'WA-8890', type: 'box-truck', status: 'maintenance', capacityKg: 8000, loadKg: 0, location: 'Seattle service center', odometerKm: 176200, fuelPct: 15, nextServiceKm: 176500 },
  { id: 'TRK-118B', plate: 'AZ-1147', type: 'box-truck', status: 'idle', capacityKg: 6000, loadKg: 0, location: 'Phoenix yard', odometerKm: 60100, fuelPct: 88, nextServiceKm: 64000 },
  { id: 'VAN-150', plate: 'CO-2231', type: 'van', status: 'idle', capacityKg: 1000, loadKg: 0, location: 'Denver yard', odometerKm: 12400, fuelPct: 95, nextServiceKm: 16000 },
  { id: 'VAN-155', plate: 'OR-7782', type: 'van', status: 'loading', capacityKg: 900, loadKg: 320, location: 'Portland DC', odometerKm: 8800, fuelPct: 78, nextServiceKm: 12000 },
  { id: 'TRK-240', plate: 'TX-9904', type: 'semi', status: 'active', driver: 'Amara Diallo', capacityKg: 20000, loadKg: 7200, location: 'Green River, UT — I-70', odometerKm: 96300, fuelPct: 66, nextServiceKm: 100000 },
]

export function findVehicle(id: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.id === id)
}
