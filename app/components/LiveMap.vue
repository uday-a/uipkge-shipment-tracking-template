<script setup lang="ts">
/**
 * LiveMap — a stylized fleet map. Real map tiles aren't available in this
 * offline template, so the canvas is a vector "city": a faint street grid
 * with status-coloured route polylines and truck markers. Each route is
 * split into a travelled (coloured) and remaining (dashed) leg at the
 * shipment's current progress. Clicking a truck selects its trip.
 *
 * Coordinate space is 1000×700; HTML markers are positioned by the same
 * fractional mapping the SVG uses (preserveAspectRatio="none"), so markers
 * and routes stay aligned as the pane resizes. Strokes use
 * vector-effect="non-scaling-stroke" to keep constant width under stretch.
 */
import { computed, ref } from 'vue'
import { Truck, Plus, Minus, LocateFixed } from 'lucide-vue-next'
import type { ResolvedTrip } from '~/mocks/live'
import type { Tone } from '~/mocks/shipments'
import { STATUS_LABELS } from '~/mocks/shipments'

const props = defineProps<{ trips: ResolvedTrip[]; selectedId: string | null }>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const W = 1000
const H = 700

const TONE_VAR: Record<Tone, string> = {
  success: 'var(--success)',
  info: 'var(--info)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  muted: 'var(--muted-foreground)',
}

function geom(path: { x: number; y: number }[], progress: number) {
  const segs: { a: { x: number; y: number }; b: { x: number; y: number }; d: number }[] = []
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!, b = path[i]!
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    segs.push({ a, b, d }); total += d
  }
  const target = total * Math.min(1, Math.max(0, progress / 100))
  let acc = 0, truck = path[path.length - 1]!, cut = segs.length - 1
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]!
    if (acc + s.d >= target) {
      const r = s.d === 0 ? 0 : (target - acc) / s.d
      truck = { x: s.a.x + (s.b.x - s.a.x) * r, y: s.a.y + (s.b.y - s.a.y) * r }
      cut = i; break
    }
    acc += s.d
  }
  const travelled = [...path.slice(0, cut + 1), truck]
  const remaining = [truck, ...path.slice(cut + 1)]
  const pts = (arr: { x: number; y: number }[]) => arr.map((p) => `${p.x},${p.y}`).join(' ')
  return { truck, travelled: pts(travelled), remaining: pts(remaining), start: path[0]! }
}

const items = computed(() =>
  props.trips.map((t) => {
    const g = geom(t.path, t.shipment.progress)
    return {
      id: t.shipment.id,
      status: t.shipment.status,
      color: TONE_VAR[t.tone],
      ...g,
      truckLeft: (g.truck.x / W) * 100,
      truckTop: (g.truck.y / H) * 100,
      startLeft: (g.start.x / W) * 100,
      startTop: (g.start.y / H) * 100,
    }
  }),
)

const hoveredId = ref<string | null>(null)
const dim = (id: string) => props.selectedId !== null && props.selectedId !== id

// Faint street grid lines.
const vLines = Array.from({ length: 11 }, (_, i) => (i + 1) * 80)
const hLines = Array.from({ length: 8 }, (_, i) => (i + 1) * 78)
</script>

<template>
  <div class="bg-muted/40 relative size-full overflow-hidden">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="absolute inset-0 size-full">
      <!-- street grid -->
      <g class="stroke-border" stroke-width="1" vector-effect="non-scaling-stroke">
        <line v-for="x in vLines" :key="`v${x}`" :x1="x" y1="0" :x2="x" :y2="H" />
        <line v-for="y in hLines" :key="`h${y}`" x1="0" :y1="y" :x2="W" :y2="y" />
      </g>
      <!-- a couple of "main roads" + a park, for texture -->
      <g class="stroke-border" stroke-width="3" vector-effect="non-scaling-stroke" fill="none">
        <polyline points="0,250 380,250 380,700" />
        <polyline points="640,0 640,360 1000,360" />
      </g>
      <ellipse cx="180" cy="600" rx="120" ry="70" class="fill-success/10" />
      <ellipse cx="880" cy="540" rx="90" ry="60" class="fill-success/10" />

      <!-- routes -->
      <g v-for="r in items" :key="r.id" :style="{ opacity: dim(r.id) ? 0.25 : 1 }" class="transition-opacity">
        <polyline
          :points="r.remaining"
          fill="none"
          class="stroke-muted-foreground/40"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="2 8"
          vector-effect="non-scaling-stroke"
        />
        <polyline
          :points="r.travelled"
          fill="none"
          :style="{ stroke: r.color }"
          :stroke-width="props.selectedId === r.id ? 5 : 4"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>

    <!-- start dots + truck markers (HTML overlay) -->
    <template v-for="r in items" :key="`m-${r.id}`">
      <span
        class="bg-background absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-opacity"
        :style="{ left: `${r.startLeft}%`, top: `${r.startTop}%`, '--tw-ring-color': r.color, opacity: dim(r.id) ? 0.3 : 1 }"
      />
      <button
        type="button"
        class="absolute -translate-x-1/2 -translate-y-1/2 outline-none transition-all"
        :style="{ left: `${r.truckLeft}%`, top: `${r.truckTop}%`, opacity: dim(r.id) ? 0.35 : 1, zIndex: props.selectedId === r.id ? 20 : 10 }"
        @click="emit('select', r.id)"
        @mouseenter="hoveredId = r.id"
        @mouseleave="hoveredId = null"
      >
        <span
          class="bg-card flex items-center justify-center rounded-full ring-[3px] transition-transform"
          :class="props.selectedId === r.id ? 'size-10 scale-100' : 'size-9 hover:scale-110'"
          :style="{ '--tw-ring-color': r.color, boxShadow: 'var(--elev-2)' }"
        >
          <Truck class="size-4" :style="{ color: r.color }" />
        </span>
        <div
          v-if="hoveredId === r.id"
          class="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1.5"
          :style="{ boxShadow: 'var(--elev-2)' }"
        >
          <p class="text-xs font-semibold">{{ r.id }}</p>
          <p class="text-muted-foreground text-xs">{{ STATUS_LABELS[r.status] }}</p>
        </div>
      </button>
    </template>

    <!-- map controls (decorative) -->
    <div class="absolute bottom-4 right-4 flex flex-col gap-1.5">
      <button class="bg-card hover:bg-accent flex size-9 items-center justify-center rounded-full border" style="box-shadow: var(--elev-1)" aria-label="Recenter">
        <LocateFixed class="size-4" />
      </button>
      <div class="bg-card flex flex-col overflow-hidden rounded-full border" style="box-shadow: var(--elev-1)">
        <button class="hover:bg-accent flex size-9 items-center justify-center" aria-label="Zoom in"><Plus class="size-4" /></button>
        <span class="bg-border h-px" />
        <button class="hover:bg-accent flex size-9 items-center justify-center" aria-label="Zoom out"><Minus class="size-4" /></button>
      </div>
    </div>
  </div>
</template>
