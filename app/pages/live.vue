<script setup lang="ts">
/**
 * Live tracking — a logistics control tower. A triage-sorted dispatch queue on
 * the left, a near-monochrome graphite fleet map on the right under a docked
 * KPI ribbon, and a right-edge inspector drawer for the selected trip. The map
 * is forced dark (a control tower reads dark); hovering a rail card lights its
 * lane, selecting opens the inspector and flies the map. Dispatcher-gated.
 */
import { ref, computed } from 'vue'
import { Target, MapPin, Truck, Star, X } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import LiveMapMapbox from '@/components/LiveMapMapbox.vue'
import { toneBadge, toneDot, shortDate } from '@/lib/utils'

import { resolvedTrips, type ResolvedTrip } from '~/mocks/live'
import { STATUS_LABELS, type Tone } from '~/mocks/shipments'
import { DRIVERS, DRIVER_STATUS_LABELS, DRIVER_STATUS_TONE } from '~/mocks/drivers'
import { VEHICLES, VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS, VEHICLE_STATUS_TONE } from '~/mocks/fleet'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Live tracking · ShipTrack' })

const trips = resolvedTrips() // already exception-first
const selectedId = ref<string | null>(null)
const mapRef = ref<{ hover?: (id: string | null) => void } | null>(null)
function select(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}
function onHover(id: string | null) {
  mapRef.value?.hover?.(id)
}

/** Tone → CSS variable, for tinting rail accents + progress fills inline. */
const TONE_BG: Record<Tone, string> = {
  success: 'var(--success)', info: 'var(--info)', warning: 'var(--warning)', destructive: 'var(--destructive)', muted: 'var(--muted-foreground)',
}
function initials(name?: string): string {
  if (!name) return '—'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// Deterministic telemetry for the inspector (SSR-safe — no clock/random).
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
function headingOf(t: ResolvedTrip): string {
  const a = t.coords[0]!, b = t.coords[t.coords.length - 1]!
  const deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  return COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8]!
}
function speedOf(t: ResolvedTrip): string {
  if (!['in-transit', 'out-for-delivery', 'picked-up'].includes(t.shipment.status)) return '0 mph'
  const n = parseInt(t.shipment.id.replace(/\D/g, '').slice(-3) || '0', 10)
  return `${48 + (n % 18)} mph`
}
function etaChip(tone: Tone): { label: string; variant: ReturnType<typeof toneBadge> } {
  if (tone === 'destructive') return { label: 'Exception', variant: 'destructive' }
  if (tone === 'warning') return { label: 'Delayed', variant: 'warning' }
  if (tone === 'muted') return { label: 'Scheduled', variant: 'secondary' }
  return { label: 'On time', variant: 'success' }
}

/** Live fleet summary for the docked KPI ribbon. */
const stats = computed(() => {
  const onRoute = trips.filter((t) => ['in-transit', 'out-for-delivery', 'picked-up'].includes(t.shipment.status)).length
  const attention = trips.filter((t) => ['delayed', 'exception'].includes(t.shipment.status)).length
  const avgProgress = Math.round(trips.reduce((s, t) => s + t.shipment.progress, 0) / Math.max(1, trips.length))
  return { active: trips.length, onRoute, attention, avgProgress }
})

/** Route-colour key, de-duped by resolved live-tone (kills the triple-blue). */
const legend = computed(() => {
  const seen = new Set<Tone>()
  const out: { label: string; tone: Tone }[] = []
  for (const t of trips) {
    if (seen.has(t.tone)) continue
    seen.add(t.tone)
    out.push({ label: STATUS_LABELS[t.shipment.status], tone: t.tone })
  }
  return out
})

const selected = computed(() => trips.find((t) => t.shipment.id === selectedId.value) ?? null)

const drivers = computed(() => [...DRIVERS].sort((a, b) => (a.status === 'on-route' ? -1 : 1)))
const vehicles = computed(() => VEHICLES.filter((v) => v.status === 'active'))
</script>

<template>
  <div class="bg-background flex h-[calc(100svh-3.5rem)] flex-col lg:flex-row">
    <!-- ── Dispatch queue rail ─────────────────────────────────────────── -->
    <aside class="bg-background flex w-full shrink-0 flex-col border-b lg:w-[384px] lg:border-b-0 lg:border-r">
      <div class="px-4 pb-3 pt-4">
        <div class="flex items-center justify-between gap-2">
          <h1 class="text-[15px] font-semibold tracking-tight">Live tracking</h1>
          <span class="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-medium">
            <span class="bg-success size-1.5 rounded-full" />
            Live
          </span>
        </div>
        <p class="text-muted-foreground mt-0.5 text-xs tabular-nums">{{ stats.active }} active · {{ stats.onRoute }} on route</p>
        <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span v-for="l in legend" :key="l.label" class="inline-flex items-center gap-1.5">
            <span class="size-2 rounded-full" :class="toneDot(l.tone)" />
            <span class="text-muted-foreground text-[11px]">{{ l.label }}</span>
          </span>
        </div>
      </div>

      <Tabs default-value="trips" class="flex min-h-0 flex-1 flex-col">
        <div class="px-4">
          <TabsList class="w-full justify-start">
            <TabsTrigger value="trips">Trips<span class="text-muted-foreground ml-1 tabular-nums">{{ trips.length }}</span></TabsTrigger>
            <TabsTrigger value="drivers">Drivers<span class="text-muted-foreground ml-1 tabular-nums">{{ drivers.length }}</span></TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles<span class="text-muted-foreground ml-1 tabular-nums">{{ vehicles.length }}</span></TabsTrigger>
          </TabsList>
        </div>

        <!-- Trips -->
        <TabsContent value="trips" class="mt-0 min-h-0 flex-1">
          <OverlayScroll class="h-full">
            <div class="space-y-1.5 p-4">
              <button
                v-for="t in trips"
                :key="t.shipment.id"
                type="button"
                class="block w-full rounded-lg border px-3 py-2.5 text-left transition-colors"
                :class="selectedId === t.shipment.id ? 'border-foreground/25 bg-accent' : 'bg-card hover:bg-accent/50'"
                @click="select(t.shipment.id)"
                @mouseenter="onHover(t.shipment.id)"
                @mouseleave="onHover(null)"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono text-[13px] font-medium">{{ t.shipment.id }}</span>
                  <Badge :variant="toneBadge(t.tone)" class="shrink-0 text-xs">{{ STATUS_LABELS[t.shipment.status] }}</Badge>
                </div>
                <div class="mt-1.5 flex items-baseline justify-between gap-2">
                  <p class="min-w-0 truncate text-[13px]">
                    {{ t.shipment.driver ?? 'Unassigned' }}<span class="text-muted-foreground font-mono"> · {{ t.shipment.vehicle ?? '—' }}</span>
                  </p>
                  <span v-if="t.distanceKm" class="text-muted-foreground shrink-0 text-[11px] tabular-nums">{{ t.distanceKm }} km</span>
                </div>
                <div class="bg-muted mt-2 h-[3px] w-full overflow-hidden rounded-full">
                  <div class="h-full rounded-full" :style="{ width: `${t.shipment.progress}%`, background: TONE_BG[t.tone] }" />
                </div>
                <span v-if="selectedId === t.shipment.id" class="text-muted-foreground mt-1 block text-[11px] tabular-nums">{{ t.shipment.progress }}% complete</span>
              </button>
            </div>
          </OverlayScroll>
        </TabsContent>

        <!-- Drivers -->
        <TabsContent value="drivers" class="mt-0 min-h-0 flex-1">
          <OverlayScroll class="h-full">
            <div class="space-y-1.5 p-4">
              <div v-for="d in drivers" :key="d.id" class="bg-card flex items-center gap-3 rounded-lg border p-3">
                <Avatar class="size-9"><AvatarFallback class="text-xs font-semibold">{{ d.initials }}</AvatarFallback></Avatar>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ d.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ d.vehicle ?? 'No vehicle' }} · {{ d.deliveriesToday }} today</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <Badge :variant="toneBadge(DRIVER_STATUS_TONE[d.status])" class="text-xs">{{ DRIVER_STATUS_LABELS[d.status] }}</Badge>
                  <span class="text-muted-foreground inline-flex items-center gap-0.5 text-xs"><Star class="fill-warning text-warning size-3" />{{ d.rating }}</span>
                </div>
              </div>
            </div>
          </OverlayScroll>
        </TabsContent>

        <!-- Vehicles -->
        <TabsContent value="vehicles" class="mt-0 min-h-0 flex-1">
          <OverlayScroll class="h-full">
            <div class="space-y-1.5 p-4">
              <div v-for="v in vehicles" :key="v.id" class="bg-card flex items-center gap-3 rounded-lg border p-3">
                <span class="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg"><Truck class="text-muted-foreground size-4" /></span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ v.id }}</p>
                  <p class="text-muted-foreground text-xs">{{ VEHICLE_TYPE_LABELS[v.type] }} · {{ v.location }}</p>
                </div>
                <Badge :variant="toneBadge(VEHICLE_STATUS_TONE[v.status])" class="shrink-0 text-xs">{{ VEHICLE_STATUS_LABELS[v.status] }}</Badge>
              </div>
            </div>
          </OverlayScroll>
        </TabsContent>
      </Tabs>
    </aside>

    <!-- ── Map column: docked KPI ribbon + graphite map ────────────────── -->
    <div class="flex min-h-[420px] flex-1 flex-col">
      <!-- Docked status ribbon (solid, SSR-safe, no float) -->
      <div class="bg-card flex h-[52px] shrink-0 items-center border-b px-4">
        <div class="flex items-stretch">
          <div class="flex flex-col justify-center pr-4">
            <span class="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">Active</span>
            <span class="text-foreground text-[15px] font-semibold tabular-nums">{{ stats.active }}</span>
          </div>
          <div class="border-border flex flex-col justify-center border-l px-4">
            <span class="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">On route</span>
            <span class="text-foreground text-[15px] font-semibold tabular-nums">{{ stats.onRoute }}</span>
          </div>
          <div class="border-border flex flex-col justify-center border-l px-4">
            <span class="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">Avg progress</span>
            <span class="text-foreground text-[15px] font-semibold tabular-nums">{{ stats.avgProgress }}%</span>
          </div>
          <div class="border-border flex flex-col justify-center border-l px-4">
            <span class="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">Needs attention</span>
            <span class="text-[15px] font-semibold tabular-nums" :class="stats.attention > 0 ? 'text-warning' : 'text-muted-foreground'">{{ stats.attention }}</span>
          </div>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
            <span class="bg-success size-1.5 rounded-full" />
            Live
          </span>
          <span class="text-muted-foreground hidden text-[11px] tabular-nums sm:inline">Updated 12s ago</span>
        </div>
      </div>

      <!-- Map fills remaining height; inspector drawer docks to its right edge -->
      <div class="relative flex-1">
        <ClientOnly>
          <LiveMapMapbox ref="mapRef" :trips="trips" :selected-id="selectedId" @select="select" />
          <!-- Calm placeholder while Mapbox's JS + tiles load — no second map. -->
          <template #fallback>
            <div class="bg-muted size-full" />
          </template>
        </ClientOnly>

        <!-- Selected-trip inspector drawer -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div
            v-if="selected"
            class="bg-popover text-popover-foreground absolute bottom-0 right-0 top-0 w-[340px] overflow-hidden border-l"
            style="box-shadow: var(--elev-3)"
          >
            <div class="p-5">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-sm font-medium">{{ selected.shipment.id }}</span>
                <button type="button" class="text-muted-foreground hover:text-foreground -mr-1.5 rounded-md p-1" aria-label="Close" @click="selectedId = null"><X class="size-4" /></button>
              </div>

              <!-- ETA hero -->
              <div class="mt-4">
                <p class="text-muted-foreground text-[11px] uppercase tracking-wide">Arrives</p>
                <div class="mt-0.5 flex items-center gap-2">
                  <span class="text-2xl font-semibold tabular-nums">{{ shortDate(selected.shipment.estimatedDelivery) }}</span>
                  <Badge :variant="etaChip(selected.tone).variant" class="text-xs">{{ etaChip(selected.tone).label }}</Badge>
                </div>
              </div>

              <!-- Telemetry -->
              <div class="border-border divide-border mt-4 grid grid-cols-3 divide-x border-y py-2.5 text-center">
                <div>
                  <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Speed</p>
                  <p class="mt-0.5 text-sm font-semibold tabular-nums">{{ speedOf(selected) }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Heading</p>
                  <p class="mt-0.5 text-sm font-semibold">{{ headingOf(selected) }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Distance</p>
                  <p class="mt-0.5 text-sm font-semibold tabular-nums">{{ selected.distanceKm || '—' }}<span v-if="selected.distanceKm" class="text-muted-foreground text-xs"> km</span></p>
                </div>
              </div>

              <!-- Driver -->
              <div class="mt-4 flex items-center gap-2.5">
                <Avatar class="size-8"><AvatarFallback class="text-[11px] font-semibold">{{ initials(selected.shipment.driver) }}</AvatarFallback></Avatar>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ selected.shipment.driver ?? 'Unassigned' }}</p>
                  <p class="text-muted-foreground font-mono text-xs">{{ selected.shipment.vehicle ?? '—' }}</p>
                </div>
              </div>

              <!-- O → D timeline -->
              <div class="mt-4">
                <div class="flex gap-2.5">
                  <Target class="text-foreground mt-0.5 size-4 shrink-0" />
                  <div class="min-w-0">
                    <p class="truncate text-sm">{{ selected.shipment.origin }}</p>
                    <p class="text-muted-foreground truncate text-xs">{{ selected.shipment.lastLocation }}</p>
                  </div>
                </div>
                <div class="bg-border my-1 ml-2 h-3 w-px" />
                <div class="flex gap-2.5">
                  <MapPin class="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <p class="truncate text-sm">{{ selected.shipment.destination }}</p>
                </div>
              </div>

              <!-- Progress -->
              <div class="mt-4">
                <div class="text-muted-foreground mb-1 text-[11px] tabular-nums">
                  {{ selected.shipment.progress }}% complete
                </div>
                <div class="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div class="h-full rounded-full" :style="{ width: `${selected.shipment.progress}%`, background: TONE_BG[selected.tone] }" />
                </div>
              </div>

              <Button as-child variant="secondary" class="mt-5 w-full">
                <NuxtLink :to="`/shipments/${selected.shipment.id}`">Open shipment</NuxtLink>
              </Button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
