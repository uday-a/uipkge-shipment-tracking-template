<script setup lang="ts">
/**
 * JourneyMap — an interactive, graphical representation of a shipment's
 * journey. Renders a stylized arc "route" from origin to destination with
 * milestone nodes, a live vehicle marker positioned at the current
 * progress, and a marching-ants animation on the remaining leg. Hovering
 * a node reveals its name + ETA.
 *
 * Pure SVG geometry (a quadratic Bézier split with De Casteljau) so the
 * solid/done leg and the dashed/remaining leg are exact. No map tiles —
 * deliberately abstract so it works offline and themes cleanly in dark
 * mode. SSR-safe: animations are CSS-only; hover state is client-only.
 */
import { ref, computed } from 'vue'
import { Truck, MapPin, Flag, PackageCheck } from 'lucide-vue-next'

interface Stop {
  name: string
  eta: string // ISO datetime
  state: 'done' | 'current' | 'pending'
}

const props = withDefaults(defineProps<{
  stops: Stop[]
  progress: number
  originLabel: string
  destinationLabel: string
  statusLabel?: string
  delivered?: boolean
}>(), { statusLabel: 'In transit', delivered: false })

// viewBox geometry. Width 800 × height 220 keeps math simple; the SVG
// scales fluidly and HTML markers are positioned by percentage of these.
const W = 800
const H = 220
const P0 = { x: 70, y: 150 }
const P1 = { x: 400, y: 52 }
const P2 = { x: 730, y: 150 }

const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})
const point = (t: number) => ({
  x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P2.x,
  y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P2.y,
})

const basePath = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`

const t = computed(() => Math.min(1, Math.max(0, props.progress / 100)))

const donePath = computed(() => {
  const m01 = lerp(P0, P1, t.value)
  const pt = point(t.value)
  return `M ${P0.x} ${P0.y} Q ${m01.x} ${m01.y} ${pt.x} ${pt.y}`
})
const remainPath = computed(() => {
  const pt = point(t.value)
  const m12 = lerp(P1, P2, t.value)
  return `M ${pt.x} ${pt.y} Q ${m12.x} ${m12.y} ${P2.x} ${P2.y}`
})
const vehicle = computed(() => point(t.value))

// Node positions evenly spaced along the curve.
const nodes = computed(() =>
  props.stops.map((s, i) => {
    const nt = props.stops.length > 1 ? i / (props.stops.length - 1) : 0
    const p = point(nt)
    return { ...s, x: p.x, y: p.y, leftPct: (p.x / W) * 100, topPct: (p.y / H) * 100 }
  }),
)

const vehicleStyle = computed(() => ({ left: `${(vehicle.value.x / W) * 100}%`, top: `${(vehicle.value.y / H) * 100}%` }))

const hovered = ref<number | null>(null)

function fmt(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()} · ${hh}:${mm}`
}
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-xl border bg-gradient-to-b from-muted/40 to-background">
    <div class="relative aspect-[800/220] w-full">
      <svg :viewBox="`0 0 ${W} ${H}`" class="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <!-- Subtle map-graticule dot grid -->
          <pattern id="jm-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" class="fill-muted-foreground/15" />
          </pattern>
          <linearGradient id="jm-done" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" class="[stop-color:var(--primary)]" stop-opacity="0.55" />
            <stop offset="100%" class="[stop-color:var(--primary)]" />
          </linearGradient>
        </defs>

        <rect :width="W" :height="H" fill="url(#jm-dots)" />

        <!-- Full route track (muted base) -->
        <path :d="basePath" fill="none" class="stroke-muted-foreground/25" stroke-width="3" stroke-linecap="round" />

        <!-- Remaining leg: dashed marching ants (skipped once delivered) -->
        <path
          v-if="!delivered"
          :d="remainPath"
          fill="none"
          class="jm-flow stroke-muted-foreground/40"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="2 10"
        />

        <!-- Completed leg: gradient, draws in on mount -->
        <path
          :d="donePath"
          fill="none"
          stroke="url(#jm-done)"
          stroke-width="4"
          stroke-linecap="round"
          pathLength="1"
          class="jm-draw"
        />
      </svg>

      <!-- Stop nodes (HTML overlay, positioned by % of the viewBox) -->
      <button
        v-for="(n, i) in nodes"
        :key="i"
        type="button"
        class="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
        :style="{ left: `${n.leftPct}%`, top: `${n.topPct}%` }"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
        @focus="hovered = i"
        @blur="hovered = null"
      >
        <span
          :class="[
            'block rounded-full ring-2 ring-background transition-transform duration-200 group-hover:scale-125',
            n.state === 'done' ? 'bg-primary size-3'
              : n.state === 'current' ? 'bg-primary size-3.5'
              : 'bg-muted-foreground/40 size-2.5',
          ]"
        />
        <!-- pulse halo for the current node -->
        <span
          v-if="n.state === 'current'"
          class="jm-pulse bg-primary/40 absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        />
      </button>

      <!-- Hover tooltip -->
      <div
        v-if="hovered !== null"
        class="bg-popover text-popover-foreground pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-2.5 py-1.5 shadow-md"
        :style="{ left: `${nodes[hovered]!.leftPct}%`, top: `calc(${nodes[hovered]!.topPct}% - 14px)` }"
      >
        <p class="whitespace-nowrap text-xs font-semibold">{{ nodes[hovered]!.name }}</p>
        <p class="text-muted-foreground whitespace-nowrap text-xs tabular-nums">{{ fmt(nodes[hovered]!.eta) }}</p>
      </div>

      <!-- Vehicle marker -->
      <div
        class="jm-vehicle absolute z-[5] -translate-x-1/2 -translate-y-1/2"
        :style="vehicleStyle"
      >
        <span class="bg-primary/25 jm-pulse absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <span class="bg-background ring-primary relative flex size-8 items-center justify-center rounded-full shadow-md ring-2">
          <PackageCheck v-if="delivered" class="text-primary size-4" />
          <Truck v-else class="text-primary size-4" />
        </span>
      </div>

      <!-- Origin / destination pins -->
      <div class="absolute -translate-x-1/2 translate-y-1" :style="{ left: `${(P0.x / W) * 100}%`, top: `${(P0.y / H) * 100}%` }">
        <span class="bg-background ring-border relative flex size-6 items-center justify-center rounded-full shadow-sm ring-1">
          <MapPin class="text-muted-foreground size-3.5" />
        </span>
      </div>
      <div class="absolute -translate-x-1/2 translate-y-1" :style="{ left: `${(P2.x / W) * 100}%`, top: `${(P2.y / H) * 100}%` }">
        <span class="bg-background ring-border relative flex size-6 items-center justify-center rounded-full shadow-sm ring-1">
          <Flag class="text-muted-foreground size-3.5" />
        </span>
      </div>
    </div>

    <!-- Footer labels -->
    <div class="flex items-center justify-between border-t px-4 py-2.5 text-xs">
      <div class="min-w-0">
        <p class="text-muted-foreground">Origin</p>
        <p class="truncate font-semibold">{{ originLabel }}</p>
      </div>
      <div class="bg-muted/60 flex items-center gap-1.5 rounded-full px-2.5 py-1">
        <span :class="['size-1.5 rounded-full', delivered ? 'bg-success' : 'bg-primary animate-pulse']" />
        <span class="font-medium">{{ delivered ? 'Delivered' : statusLabel }}</span>
        <span class="text-muted-foreground tabular-nums">· {{ Math.round(progress) }}%</span>
      </div>
      <div class="min-w-0 text-right">
        <p class="text-muted-foreground">Destination</p>
        <p class="truncate font-semibold">{{ destinationLabel }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Draw the completed leg in on mount. pathLength="1" normalises the dash
   math so we don't need to measure the path. */
@keyframes jm-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
.jm-draw {
  stroke-dasharray: 1;
  animation: jm-draw 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Marching-ants flow on the remaining leg — reads as "still moving". */
@keyframes jm-flow {
  to { stroke-dashoffset: -120; }
}
.jm-flow {
  animation: jm-flow 3s linear infinite;
}

/* Soft pulse halo behind the current node + the vehicle. */
@keyframes jm-pulse {
  0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.7; }
  70% { transform: translate(-50%, -50%) scale(2.1); opacity: 0; }
  100% { opacity: 0; }
}
.jm-pulse {
  animation: jm-pulse 2.4s ease-out infinite;
}

/* Vehicle glides into place as the done-leg draws. */
@keyframes jm-vehicle-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.jm-vehicle {
  animation: jm-vehicle-in 900ms ease-out backwards;
  animation-delay: 300ms;
}

@media (prefers-reduced-motion: reduce) {
  .jm-draw { animation-duration: 1ms; }
  .jm-flow { animation: none; }
  .jm-pulse { animation: none; opacity: 0; }
  .jm-vehicle { animation: none; }
}
</style>
