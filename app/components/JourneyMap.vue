<script setup lang="ts">
/**
 * JourneyMap — a quiet graphical view of a shipment's route. A curved path
 * from origin to destination with milestone nodes, a vehicle marker at the
 * current progress, and hoverable stops. Geometry is an exact quadratic
 * Bézier split (De Casteljau) so the solid/done and dashed/remaining legs
 * meet precisely at the vehicle. SSR-safe; only a one-shot draw-in on mount.
 */
import { ref, computed } from 'vue'
import { Truck, MapPin, Flag, PackageCheck } from 'lucide-vue-next'

interface Stop {
  name: string
  eta: string
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

const W = 800
const H = 220
const P0 = { x: 70, y: 150 }
const P1 = { x: 400, y: 58 }
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
const nodes = computed(() =>
  props.stops.map((s, i) => {
    const nt = props.stops.length > 1 ? i / (props.stops.length - 1) : 0
    const p = point(nt)
    return { ...s, leftPct: (p.x / W) * 100, topPct: (p.y / H) * 100 }
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
  <div class="bg-background relative w-full overflow-hidden rounded-xl border">
    <div class="relative aspect-[800/220] w-full">
      <svg :viewBox="`0 0 ${W} ${H}`" class="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
        <!-- Full route track (outline tone) -->
        <path :d="basePath" fill="none" class="stroke-border" stroke-width="3" stroke-linecap="round" />
        <!-- Remaining leg: static dashed -->
        <path
          v-if="!delivered"
          :d="remainPath"
          fill="none"
          class="stroke-muted-foreground/35"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="2 9"
        />
        <!-- Completed leg: flat primary, draws in once -->
        <path
          :d="donePath"
          fill="none"
          class="stroke-primary jm-draw"
          stroke-width="3.5"
          stroke-linecap="round"
          pathLength="1"
        />
      </svg>

      <!-- Stop nodes -->
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
            n.state === 'pending' ? 'bg-muted-foreground/30 size-2.5' : 'bg-primary size-3',
          ]"
        />
        <span
          v-if="n.state === 'current'"
          class="ring-primary/40 absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
        />
      </button>

      <!-- Hover tooltip -->
      <div
        v-if="hovered !== null"
        class="bg-popover text-popover-foreground pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-2.5 py-1.5"
        :style="{ left: `${nodes[hovered]!.leftPct}%`, top: `calc(${nodes[hovered]!.topPct}% - 14px)`, boxShadow: 'var(--elev-2)' }"
      >
        <p class="whitespace-nowrap text-xs font-semibold">{{ nodes[hovered]!.name }}</p>
        <p class="text-muted-foreground whitespace-nowrap text-xs tabular-nums">{{ fmt(nodes[hovered]!.eta) }}</p>
      </div>

      <!-- Vehicle marker -->
      <div class="absolute z-[5] -translate-x-1/2 -translate-y-1/2" :style="vehicleStyle">
        <span
          class="bg-card ring-primary relative flex size-8 items-center justify-center rounded-full ring-2"
          style="box-shadow: var(--elev-2)"
        >
          <PackageCheck v-if="delivered" class="text-primary size-4" />
          <Truck v-else class="text-primary size-4" />
        </span>
      </div>

      <!-- Endpoint pins -->
      <div class="absolute -translate-x-1/2 translate-y-1" :style="{ left: `${(P0.x / W) * 100}%`, top: `${(P0.y / H) * 100}%` }">
        <span class="bg-card ring-border flex size-6 items-center justify-center rounded-full ring-1">
          <MapPin class="text-muted-foreground size-3.5" />
        </span>
      </div>
      <div class="absolute -translate-x-1/2 translate-y-1" :style="{ left: `${(P2.x / W) * 100}%`, top: `${(P2.y / H) * 100}%` }">
        <span class="bg-card ring-border flex size-6 items-center justify-center rounded-full ring-1">
          <Flag class="text-muted-foreground size-3.5" />
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between border-t px-4 py-2.5 text-xs">
      <div class="min-w-0">
        <p class="text-muted-foreground">Origin</p>
        <p class="truncate font-semibold">{{ originLabel }}</p>
      </div>
      <div class="bg-muted flex items-center gap-1.5 rounded-full px-2.5 py-1">
        <span :class="['size-1.5 rounded-full', delivered ? 'bg-success' : 'bg-primary']" />
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
@keyframes jm-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
.jm-draw {
  stroke-dasharray: 1;
  animation: jm-draw 900ms cubic-bezier(0.2, 0, 0, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .jm-draw { animation-duration: 1ms; }
}
</style>
