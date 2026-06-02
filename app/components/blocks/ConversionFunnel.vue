<script setup lang="ts">
/**
 * Conversion funnel: SmoothFunnel chart with count strip above and
 * stage-name + retention-from-previous strip below.
 *
 * Works for any drop-off flow with 3-6 stages: hiring (applied ->
 * hired), e-commerce (sessions -> purchases), onboarding (signed up
 * -> activated), etc. Reads as a single horizontal "flow":
 *
 *   72K        38.2K       16.8K       5.6K
 *   ╔══════╗╔════════╗╔══════════╗╔══════════╗
 *   ║ 100% ║║  53%   ║║   23%    ║║    8%    ║
 *   ╚══════╝╚════════╝╚══════════╝╚══════════╝
 *   Views      Cart        Checkout    Purchase
 *              -> 53%       -> 44%      -> 33%
 *
 * The middle pill (inside each band) shows the share OF THE TOP
 * stage (100%, 53%, 23%, ...). The bottom retention number shows the
 * stage-to-stage conversion -- usually the more actionable signal.
 */
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { SmoothFunnel } from '@/components/ui/charts/smooth-funnel'

interface Stage {
  name: string
  value: number
}

interface Props {
  data: Stage[]
  /** SmoothFunnel container height. Defaults to 180. */
  height?: number | string
  /** Override colour palette. Defaults to the registry's chart-1..N
   *  OKLCH tokens via CSS variables (so light/dark + theme-customizer
   *  flips ripple through without any JS). Pass a literal hex array to
   *  override. */
  colors?: string[]
  /** Compact number formatter for the count strip (default toLocaleString). */
  format?: (n: number) => string
  /** Hide the retention-from-previous footer on each non-first stage. */
  hideRetention?: boolean
  /** Show the inline percent pills inside each funnel band. Default
   *  true (matches SmoothFunnel). Turn off when the funnel sits in a
   *  narrow column — the labels squash inside the tail stages and the
   *  counts above already carry the absolute numbers. */
  showLabels?: boolean
  /** Minimum band height in px for tail stages — softens the sharp
   *  taper at the right end when the last stage's value is tiny
   *  relative to the head. Forwarded to SmoothFunnel. Default 18. */
  minHeight?: number
  class?: HTMLAttributes['class']
}

const DEFAULT_PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-1)',
]

const props = withDefaults(defineProps<Props>(), {
  height: 180,
  hideRetention: false,
  showLabels: true,
})

const palette = computed(() => props.colors ?? DEFAULT_PALETTE)
const fmt = (v: number) => (props.format ? props.format(v) : v.toLocaleString())
const retention = (i: number) => {
  if (i === 0) return null
  const prev = props.data[i - 1]?.value ?? 1
  return Math.round((props.data[i]!.value / prev) * 100)
}
</script>

<template>
  <!-- Layout: header strip + flex-1 SVG band + footer strip. The SVG
       grows to absorb any remaining height on the parent so the funnel
       fills its card instead of sitting on top of a wasted whitespace
       margin. `height` prop becomes a min-height hint when the parent
       is constrained — pass `100%` from a flex-1 wrapper for full
       stretch. -->
  <div data-uipkge data-slot="conversion-funnel" :class="cn('flex h-full flex-col gap-2', props.class)">
    <!-- Top: per-stage count -->
    <div
      class="grid shrink-0 text-center"
      :style="{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }"
    >
      <div
        v-for="stage in data"
        :key="`top-${stage.name}`"
        class="text-foreground text-base font-bold tabular-nums"
      >
        {{ fmt(stage.value) }}
      </div>
    </div>

    <!-- Funnel SVG: flex-1 to absorb remaining card height. -->
    <SmoothFunnel
      :data="data"
      :height="height"
      :colors="palette"
      :show-labels="showLabels"
      v-bind="minHeight !== undefined ? { minHeight } : {}"
      class="min-h-0 flex-1"
    />

    <!-- Bottom: stage name + retention from previous -->
    <div
      class="grid shrink-0 text-center"
      :style="{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(stage, i) in data"
        :key="`bot-${stage.name}`"
        class="space-y-0.5"
      >
        <p class="text-muted-foreground text-xs">{{ stage.name }}</p>
        <p
          v-if="!hideRetention && retention(i) !== null"
          class="text-info text-xs font-semibold tabular-nums"
        >
          → {{ retention(i) }}% retained
        </p>
      </div>
    </div>
  </div>
</template>
