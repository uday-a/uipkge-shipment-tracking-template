import { use } from 'echarts/core'
import { LegacyGridContainLabel } from 'echarts/features'

// ECharts 6 split `grid.containLabel` into an opt-in legacy feature. The
// vendored chart components (app/components/ui/charts/**) still pass
// `containLabel: true`, so register it globally once instead of editing
// the registry tree in place.
export default defineNuxtPlugin(() => {
  use([LegacyGridContainLabel])
})
