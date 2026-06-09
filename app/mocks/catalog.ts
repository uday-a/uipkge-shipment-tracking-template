/**
 * Zepp ebike catalog — the product line. Hand-built, deterministic.
 *
 * Every other mock references these SKUs: containers arrive carrying a mix
 * of models, warehouses/DCs hold stock per model, and each consumer order
 * is for one model. Keep the SKU set stable — ids are cross-referenced.
 */

export type BikeSegment = 'commuter' | 'mountain' | 'cargo' | 'folding' | 'lite'

export interface BikeModel {
  sku: string
  name: string
  segment: BikeSegment
  msrpUsd: number
  rangeMiles: number
  weightKg: number
  topSpeedMph: number
}

export const SEGMENT_LABELS: Record<BikeSegment, string> = {
  commuter: 'Commuter',
  mountain: 'Mountain',
  cargo: 'Cargo',
  folding: 'Folding',
  lite: 'Lite',
}

export const CATALOG: BikeModel[] = [
  { sku: 'ZB-CITY', name: 'Zepp City', segment: 'commuter', msrpUsd: 1499, rangeMiles: 40, weightKg: 22, topSpeedMph: 20 },
  { sku: 'ZB-PRO', name: 'Zepp Commuter Pro', segment: 'commuter', msrpUsd: 2199, rangeMiles: 60, weightKg: 24, topSpeedMph: 28 },
  { sku: 'ZB-TRAIL', name: 'Zepp Trail X', segment: 'mountain', msrpUsd: 2899, rangeMiles: 50, weightKg: 26, topSpeedMph: 28 },
  { sku: 'ZB-CARGO', name: 'Zepp Cargo Max', segment: 'cargo', msrpUsd: 3299, rangeMiles: 55, weightKg: 38, topSpeedMph: 20 },
  { sku: 'ZB-LITE', name: 'Zepp Lite', segment: 'lite', msrpUsd: 1099, rangeMiles: 35, weightKg: 17, topSpeedMph: 20 },
  { sku: 'ZB-FOLD', name: 'Zepp Fold F1', segment: 'folding', msrpUsd: 1799, rangeMiles: 45, weightKg: 19, topSpeedMph: 20 },
]

const BY_SKU: Record<string, BikeModel> = Object.fromEntries(CATALOG.map((m) => [m.sku, m]))

export function findModel(sku: string): BikeModel | undefined {
  return BY_SKU[sku]
}

/** Short model name for a SKU (falls back to the raw SKU). */
export function modelName(sku: string): string {
  return BY_SKU[sku]?.name ?? sku
}

/** Total unit count across a model-mix manifest. */
export function manifestUnits(manifest: Record<string, number>): number {
  return Object.values(manifest).reduce((sum, n) => sum + n, 0)
}

/** Total retail value (MSRP) across a manifest. */
export function manifestValueUsd(manifest: Record<string, number>): number {
  return Object.entries(manifest).reduce((sum, [sku, n]) => sum + (BY_SKU[sku]?.msrpUsd ?? 0) * n, 0)
}

/** Total shipping weight (kg) across a manifest. */
export function manifestWeightKg(manifest: Record<string, number>): number {
  return Object.entries(manifest).reduce((sum, [sku, n]) => sum + (BY_SKU[sku]?.weightKg ?? 0) * n, 0)
}

/** Human summary like "18× Zepp City, 6× Zepp Cargo Max" (most units first). */
export function manifestSummary(manifest: Record<string, number>): string {
  return Object.entries(manifest)
    .sort((a, b) => b[1] - a[1])
    .map(([sku, n]) => `${n}× ${modelName(sku)}`)
    .join(', ')
}
