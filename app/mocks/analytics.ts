/**
 * Mock analytics series. Static, hand-tuned, SSR-safe. Powers the
 * Analytics page charts. Numbers are internally consistent with the
 * dashboard's volume + on-time story.
 */

export interface MonthlyKpi {
  month: string
  shipments: number
  onTime: number // percent
  avgTransitHrs: number
  costPerShipment: number
}

export const MONTHLY: MonthlyKpi[] = [
  { month: 'Jun', shipments: 3820, onTime: 91.2, avgTransitHrs: 41, costPerShipment: 38.2 },
  { month: 'Jul', shipments: 3960, onTime: 91.8, avgTransitHrs: 40, costPerShipment: 37.9 },
  { month: 'Aug', shipments: 4105, onTime: 92.1, avgTransitHrs: 40, costPerShipment: 37.4 },
  { month: 'Sep', shipments: 4280, onTime: 92.4, avgTransitHrs: 39, costPerShipment: 37.1 },
  { month: 'Oct', shipments: 4520, onTime: 92.0, avgTransitHrs: 41, costPerShipment: 37.6 },
  { month: 'Nov', shipments: 5140, onTime: 92.7, avgTransitHrs: 43, costPerShipment: 39.1 },
  { month: 'Dec', shipments: 5680, onTime: 93.1, avgTransitHrs: 44, costPerShipment: 40.2 },
  { month: 'Jan', shipments: 4390, onTime: 93.4, avgTransitHrs: 39, costPerShipment: 36.8 },
  { month: 'Feb', shipments: 4210, onTime: 93.8, avgTransitHrs: 38, costPerShipment: 36.4 },
  { month: 'Mar', shipments: 4640, onTime: 94.0, avgTransitHrs: 38, costPerShipment: 36.0 },
  { month: 'Apr', shipments: 4880, onTime: 94.3, avgTransitHrs: 37, costPerShipment: 35.7 },
  { month: 'May', shipments: 5020, onTime: 94.6, avgTransitHrs: 37, costPerShipment: 35.4 },
]

export interface ServiceMix {
  name: string
  value: number
  color: string
}

// Harbor categorical ramp: teal → sage → deep slate-teal → sand → amber.
export const SERVICE_MIX: ServiceMix[] = [
  { name: 'Standard', value: 2140, color: '#2a8f88' },
  { name: 'Express', value: 1280, color: '#5fb3a8' },
  { name: 'Freight', value: 940, color: '#2f5d63' },
  { name: 'Overnight', value: 420, color: '#cbb78a' },
  { name: 'Same-day', value: 240, color: '#e08a00' },
]

export interface ExceptionReason {
  reason: string
  count: number
}

export const EXCEPTION_REASONS: ExceptionReason[] = [
  { reason: 'Weather', count: 34 },
  { reason: 'Address issue', count: 22 },
  { reason: 'Customs hold', count: 18 },
  { reason: 'Mechanical', count: 14 },
  { reason: 'Damage', count: 9 },
  { reason: 'Recipient unavailable', count: 27 },
]

export interface LanePerf {
  lane: string
  shipments: number
  onTime: number
  avgHrs: number
}

export const TOP_LANES: LanePerf[] = [
  { lane: 'LA → Phoenix', shipments: 412, onTime: 97, avgHrs: 6 },
  { lane: 'Chicago → Denver', shipments: 388, onTime: 93, avgHrs: 16 },
  { lane: 'Dallas → Houston', shipments: 366, onTime: 95, avgHrs: 4 },
  { lane: 'New York → Chicago', shipments: 314, onTime: 90, avgHrs: 13 },
  { lane: 'Seattle → Portland', shipments: 298, onTime: 98, avgHrs: 3 },
  { lane: 'Miami → Atlanta', shipments: 256, onTime: 92, avgHrs: 11 },
]

export interface DailyVolume {
  day: string
  inbound: number
  outbound: number
}

export const WEEKLY_VOLUME: DailyVolume[] = [
  { day: 'Mon', inbound: 742, outbound: 698 },
  { day: 'Tue', inbound: 781, outbound: 760 },
  { day: 'Wed', inbound: 804, outbound: 788 },
  { day: 'Thu', inbound: 829, outbound: 812 },
  { day: 'Fri', inbound: 868, outbound: 851 },
  { day: 'Sat', inbound: 512, outbound: 489 },
  { day: 'Sun', inbound: 318, outbound: 301 },
]
