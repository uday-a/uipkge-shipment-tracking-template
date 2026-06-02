<script setup lang="ts">
/**
 * KPI tile. Pattern: label / number / delta pill + hint / full-width
 * sparkline strip pinned to the bottom of the card.
 *
 * Lives in app/components (not the registry) because it bakes a specific
 * layout opinion. Used on every surface with a KPI band (dashboard,
 * shipments, fleet, analytics, detail pages).
 *
 * `tone` drives the icon chip + hint colour via OKLCH semantic tokens:
 *   - info     (blue)    : neutral / informational
 *   - success  (emerald) : "good" direction
 *   - warning  (amber)   : flagged / needs attention
 *   - destructive (rose) : actionable / negative direction
 */
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/charts/sparkline'
import { chartColors } from '@/components/ui/charts/useChartTheme'
import { useCountUp } from '@/composables/useCountUp'

export type KpiTone = 'info' | 'success' | 'warning' | 'destructive'

interface Props {
  label: string
  value: string | number
  delta?: { value: string; positive: boolean }
  spark?: number[]
  sparkLabels?: string[]
  hint?: string
  tone?: KpiTone
  /** Lucide icon component, e.g. `Package`. Optional. */
  icon?: any
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'info',
})

// Parse the numeric core out of the value string so the count-up ramp can
// animate the digits ("4.2%" → 4.2 with precision 1; "247" → 247).
const valueParts = computed(() => {
  const raw = String(props.value)
  const match = raw.match(/^(-?[\d,]+(?:\.\d+)?)(.*)$/)
  if (!match) return { num: null as number | null, suffix: raw, prefix: '', precision: 0 }
  const numStr = match[1]!.replace(/,/g, '')
  const suffix = match[2] ?? ''
  const dotIdx = numStr.indexOf('.')
  const precision = dotIdx === -1 ? 0 : numStr.length - dotIdx - 1
  return { num: Number(numStr), suffix, prefix: '', precision }
})

const localTrigger = ref(false)
const target = computed(() => valueParts.value.num ?? 0)
const displayNum = useCountUp(target.value, localTrigger, {
  duration: 600,
  precision: valueParts.value.precision,
})
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    localTrigger.value = true
  })
}

// Re-ramp the count-up when the persona switches so the band visibly
// acknowledges the scope change.
const { current: persona } = usePersona()
watch(persona, () => {
  if (typeof window === 'undefined') return
  localTrigger.value = false
  requestAnimationFrame(() => {
    localTrigger.value = true
  })
})

const displayValue = computed(() => {
  if (valueParts.value.num === null) return String(props.value)
  const p = valueParts.value.precision
  const n = displayNum.value.toFixed(p)
  // Re-introduce thousands separators for whole-number tiles.
  const grouped = p === 0 ? Number(n).toLocaleString('en-US') : n
  return `${grouped}${valueParts.value.suffix}`
})

const TONE_CHIP: Record<KpiTone, string> = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}

const TONE_HINT: Record<KpiTone, string> = {
  info: 'text-muted-foreground',
  success: 'text-success/80',
  warning: 'text-warning/85',
  destructive: 'text-destructive/85',
}

const lineColor = computed(() => chartColors.value[0]!)
const iconChipClass = computed(() => TONE_CHIP[props.tone])
const hintToneClass = computed(() => TONE_HINT[props.tone])

// Textual summary of the sparkline for screen readers + print fallback.
const sparkSummary = computed(() => {
  if (!props.spark?.length) return ''
  const arr = props.spark
  const first = arr[0]!
  const last = arr[arr.length - 1]!
  const peak = Math.max(...arr)
  const trough = Math.min(...arr)
  const diff = last - first
  const pct = first === 0 ? 0 : Math.round((diff / first) * 100)
  const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  const dirWord = dir === 'flat' ? 'flat' : `trending ${dir}`
  const span = arr.length
  const labels = props.sparkLabels
  const peakIdx = arr.indexOf(peak)
  const troughIdx = arr.indexOf(trough)
  if (labels && labels.length === arr.length) {
    return `${span}-point trend, ${dirWord} ${pct >= 0 ? '+' : ''}${pct}%. Peak ${labels[peakIdx] ?? ''} at ${peak}, low ${labels[troughIdx] ?? ''} at ${trough}.`
  }
  return `${span}-point trend, ${dirWord} ${pct >= 0 ? '+' : ''}${pct}%. Range ${trough}–${peak}.`
})
</script>

<template>
  <Card class="hover:border-foreground/20 group relative overflow-hidden transition-colors">
    <CardContent class="space-y-4 p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            {{ label }}
          </p>
          <p class="mt-1.5 text-3xl font-bold tabular-nums tracking-tight">{{ displayValue }}</p>
        </div>
        <div
          v-if="icon"
          :class="['flex size-9 shrink-0 items-center justify-center rounded-lg', iconChipClass]"
        >
          <component :is="icon" class="size-4" />
        </div>
      </div>

      <div v-if="delta || hint" class="flex items-center justify-between gap-2">
        <span
          v-if="delta"
          :class="[
            'inline-flex h-5 items-center gap-0.5 rounded-full px-1.5 text-xs tabular-nums',
            delta.positive
              ? 'bg-success/10 text-success font-extrabold tracking-tight'
              : 'bg-destructive/10 text-destructive font-bold tracking-normal italic',
          ]"
        >
          <component :is="delta.positive ? ArrowUp : ArrowDown" class="size-3" />
          {{ delta.value }}
        </span>
        <p v-if="hint" :class="['text-xs', hintToneClass]">{{ hint }}</p>
      </div>
    </CardContent>

    <div
      v-if="spark?.length"
      :key="persona"
      class="spark-draw -mb-px opacity-70"
      role="img"
      :aria-label="sparkSummary"
      :title="sparkSummary"
    >
      <ClientOnly>
        <Sparkline :data="spark" :color="lineColor" :height="24" />
        <template #fallback>
          <div class="h-6 w-full" />
        </template>
      </ClientOnly>
    </div>
    <p
      v-if="sparkSummary"
      class="text-muted-foreground hidden px-5 pb-3 text-xs tabular-nums print:block"
    >
      {{ sparkSummary }}
    </p>
  </Card>
</template>

<style scoped>
@keyframes spark-draw {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 0.7;
  }
}

.spark-draw {
  transform-origin: left center;
  animation: spark-draw 480ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

@media (prefers-reduced-motion: reduce) {
  .spark-draw {
    animation-duration: 1ms;
  }
}
</style>
