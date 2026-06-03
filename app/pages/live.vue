<script setup lang="ts">
/**
 * Live tracking — a trip list beside a live fleet map (inspired by the
 * classic logistics control-tower split view). Selecting a trip in the
 * list highlights its route + truck on the map, and vice-versa. Drivers
 * and Vehicles tabs reuse the fleet mocks. Dispatcher-gated.
 */
import { ref, computed } from 'vue'
import { Package, Target, MapPin, Truck, ChevronRight, Star, Navigation, Gauge, TriangleAlert, X } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import LiveMap from '@/components/LiveMap.vue'
import LiveMapMapbox from '@/components/LiveMapMapbox.vue'
import { toneBadge, toneDot, shortDate } from '@/lib/utils'

import { resolvedTrips } from '~/mocks/live'
import { STATUS_LABELS, STATUS_TONE, type Tone } from '~/mocks/shipments'
import { DRIVERS, DRIVER_STATUS_LABELS, DRIVER_STATUS_TONE } from '~/mocks/drivers'
import { VEHICLES, VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS, VEHICLE_STATUS_TONE } from '~/mocks/fleet'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Live tracking · ShipTrack' })

const trips = resolvedTrips()
const selectedId = ref<string | null>(null)
function select(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

/** Tone → CSS variable, for tinting progress fills inline. */
const TONE_BG: Record<Tone, string> = {
  success: 'var(--success)', info: 'var(--info)', warning: 'var(--warning)', destructive: 'var(--destructive)', muted: 'var(--muted-foreground)',
}
function initials(name?: string): string {
  if (!name) return '—'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

/** Live fleet summary for the on-map control-tower strip (scoped to mapped trips). */
const stats = computed(() => {
  const onRoute = trips.filter((t) => ['in-transit', 'out-for-delivery', 'picked-up'].includes(t.shipment.status)).length
  const attention = trips.filter((t) => ['delayed', 'exception'].includes(t.shipment.status)).length
  const avgProgress = Math.round(trips.reduce((s, t) => s + t.shipment.progress, 0) / Math.max(1, trips.length))
  return { active: trips.length, onRoute, attention, avgProgress }
})

/** Distinct statuses currently on the map, for the route-colour legend. */
const legend = computed(() => {
  const seen = new Set<string>()
  const out: { status: string; label: string; tone: Tone }[] = []
  for (const t of trips) {
    if (seen.has(t.shipment.status)) continue
    seen.add(t.shipment.status)
    out.push({ status: t.shipment.status, label: STATUS_LABELS[t.shipment.status], tone: t.tone })
  }
  return out
})

const selected = computed(() => trips.find((t) => t.shipment.id === selectedId.value) ?? null)

const drivers = computed(() => [...DRIVERS].sort((a, b) => (a.status === 'on-route' ? -1 : 1)))
const vehicles = computed(() => VEHICLES.filter((v) => v.status === 'active'))
</script>

<template>
  <div class="flex h-[calc(100svh-3.5rem)] flex-col lg:flex-row">
    <!-- List rail -->
    <aside class="bg-background flex w-full shrink-0 flex-col border-b lg:w-[384px] lg:border-b-0 lg:border-r">
      <div class="px-4 pt-4">
        <div class="flex items-center justify-between gap-2">
          <h1 class="text-lg font-bold tracking-tight">Live tracking</h1>
          <span class="text-success bg-success/10 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium">
            <span class="relative flex size-1.5">
              <span class="bg-success/70 absolute inline-flex size-full animate-ping rounded-full" />
              <span class="bg-success relative inline-flex size-1.5 rounded-full" />
            </span>
            Live
          </span>
        </div>
        <p class="text-muted-foreground text-xs">{{ trips.length }} active trips on the map</p>
      </div>

      <Tabs default-value="trips" class="flex min-h-0 flex-1 flex-col">
        <div class="px-4 pt-3">
          <TabsList class="w-full justify-start">
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          </TabsList>
        </div>

        <!-- Trips -->
        <TabsContent value="trips" class="mt-0 min-h-0 flex-1">
          <OverlayScroll class="h-full">
            <div class="space-y-2.5 p-4">
              <button
                v-for="t in trips"
                :key="t.shipment.id"
                type="button"
                class="block w-full rounded-xl border p-3 text-left transition-colors"
                :class="selectedId === t.shipment.id ? 'border-primary/40 bg-accent ring-1 ring-primary/20' : 'hover:bg-accent/50'"
                @click="select(t.shipment.id)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="bg-muted flex size-7 shrink-0 items-center justify-center rounded-lg">
                      <Package class="text-muted-foreground size-3.5" />
                    </span>
                    <span class="truncate font-medium">{{ t.shipment.id }}</span>
                  </div>
                  <Badge :variant="toneBadge(STATUS_TONE[t.shipment.status])" class="shrink-0 text-xs">
                    {{ STATUS_LABELS[t.shipment.status] }}
                  </Badge>
                </div>

                <div class="mt-3 flex items-end justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{{ t.shipment.driver ?? 'Unassigned' }}</p>
                    <p class="text-muted-foreground font-mono text-xs">{{ t.shipment.vehicle ?? '—' }}</p>
                  </div>
                  <span v-if="t.distanceKm" class="text-muted-foreground shrink-0 text-xs tabular-nums">{{ t.distanceKm }} km</span>
                </div>

                <div class="mt-3">
                  <div class="flex gap-2.5">
                    <Target class="text-primary mt-0.5 size-4 shrink-0" />
                    <div class="min-w-0">
                      <p class="truncate text-sm">{{ t.shipment.origin }}</p>
                      <p class="text-muted-foreground truncate text-xs">{{ t.shipment.lastLocation }}</p>
                    </div>
                  </div>
                  <div class="bg-border ml-2 my-1 h-3 w-px" />
                  <div class="flex gap-2.5">
                    <MapPin class="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <div class="min-w-0">
                      <p class="truncate text-sm">{{ t.shipment.destination }}</p>
                      <p class="text-muted-foreground truncate text-xs">ETA {{ shortDate(t.shipment.estimatedDelivery) }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
                  <div class="h-full rounded-full transition-[width] duration-500" :style="{ width: `${t.shipment.progress}%`, background: TONE_BG[t.tone] }" />
                </div>

                <div class="mt-2 flex items-center justify-between border-t pt-2">
                  <span class="text-muted-foreground text-xs tabular-nums">{{ t.shipment.progress }}% complete</span>
                  <NuxtLink :to="`/shipments/${t.shipment.id}`" class="text-primary inline-flex items-center gap-0.5 text-xs font-medium hover:underline" @click.stop>
                    Details<ChevronRight class="size-3" />
                  </NuxtLink>
                </div>
              </button>
            </div>
          </OverlayScroll>
        </TabsContent>

        <!-- Drivers -->
        <TabsContent value="drivers" class="mt-0 min-h-0 flex-1">
          <OverlayScroll class="h-full">
            <div class="space-y-1.5 p-4">
              <div v-for="d in drivers" :key="d.id" class="flex items-center gap-3 rounded-xl border p-3">
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
              <div v-for="v in vehicles" :key="v.id" class="flex items-center gap-3 rounded-xl border p-3">
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

    <!-- Map: real Mapbox GL JS on the client, vector fallback for SSR/offline -->
    <div class="relative min-h-[420px] flex-1">
      <ClientOnly>
        <LiveMapMapbox :trips="trips" :selected-id="selectedId" @select="select" />
        <template #fallback>
          <LiveMap :trips="trips" :selected-id="selectedId" @select="select" />
        </template>
      </ClientOnly>

      <!-- Control-tower overlays — deterministic, render on SSR + over both maps -->
      <div class="pointer-events-none absolute inset-0 hidden sm:block">
        <!-- KPI strip + route legend, top-left -->
        <div class="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-col gap-2">
          <div class="flex flex-wrap gap-2">
            <div class="bg-card/85 flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-md" style="box-shadow: var(--elev-2)">
              <span class="bg-info/10 text-info flex size-8 items-center justify-center rounded-lg"><Truck class="size-4" /></span>
              <div><p class="text-base font-bold leading-none tabular-nums">{{ stats.active }}</p><p class="text-muted-foreground mt-0.5 text-[11px]">Active trips</p></div>
            </div>
            <div class="bg-card/85 flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-md" style="box-shadow: var(--elev-2)">
              <span class="bg-success/10 text-success flex size-8 items-center justify-center rounded-lg"><Navigation class="size-4" /></span>
              <div><p class="text-base font-bold leading-none tabular-nums">{{ stats.onRoute }}</p><p class="text-muted-foreground mt-0.5 text-[11px]">On route</p></div>
            </div>
            <div class="bg-card/85 flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-md" style="box-shadow: var(--elev-2)">
              <span class="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg"><Gauge class="size-4" /></span>
              <div><p class="text-base font-bold leading-none tabular-nums">{{ stats.avgProgress }}%</p><p class="text-muted-foreground mt-0.5 text-[11px]">Avg progress</p></div>
            </div>
            <div class="bg-card/85 flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-md" style="box-shadow: var(--elev-2)">
              <span class="bg-warning/10 text-warning flex size-8 items-center justify-center rounded-lg"><TriangleAlert class="size-4" /></span>
              <div><p class="text-base font-bold leading-none tabular-nums">{{ stats.attention }}</p><p class="text-muted-foreground mt-0.5 text-[11px]">Needs attention</p></div>
            </div>
          </div>
          <div class="bg-card/85 w-fit rounded-xl border px-3 py-2 backdrop-blur-md" style="box-shadow: var(--elev-2)">
            <p class="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-wider">Route status</p>
            <div class="flex flex-col gap-1">
              <div v-for="l in legend" :key="l.status" class="flex items-center gap-2">
                <span class="size-2 rounded-full" :class="toneDot(l.tone)" />
                <span class="text-xs">{{ l.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected trip detail card, top-right -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-x-2 opacity-0"
          enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-x-0 opacity-100"
          leave-to-class="translate-x-2 opacity-0"
        >
          <div v-if="selected" class="bg-card/90 pointer-events-auto absolute right-3 top-3 w-[300px] rounded-xl border p-4 backdrop-blur-md" style="box-shadow: var(--elev-3)">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="bg-muted flex size-7 items-center justify-center rounded-lg"><Package class="text-muted-foreground size-3.5" /></span>
                <span class="font-semibold">{{ selected.shipment.id }}</span>
              </div>
              <button type="button" class="text-muted-foreground hover:text-foreground -mr-1 -mt-1 rounded-md p-1" aria-label="Close" @click="selectedId = null"><X class="size-4" /></button>
            </div>
            <Badge :variant="toneBadge(selected.tone)" class="mt-2 text-xs">{{ STATUS_LABELS[selected.shipment.status] }}</Badge>

            <div class="mt-3 flex items-center gap-2.5">
              <Avatar class="size-8"><AvatarFallback class="text-[11px] font-semibold">{{ initials(selected.shipment.driver) }}</AvatarFallback></Avatar>
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ selected.shipment.driver ?? 'Unassigned' }}</p>
                <p class="text-muted-foreground font-mono text-xs">{{ selected.shipment.vehicle ?? '—' }}</p>
              </div>
            </div>

            <div class="mt-3 space-y-1.5">
              <div class="flex items-center gap-2.5"><Target class="text-primary size-4 shrink-0" /><span class="truncate text-sm">{{ selected.shipment.origin }}</span></div>
              <div class="flex items-center gap-2.5"><MapPin class="text-muted-foreground size-4 shrink-0" /><span class="truncate text-sm">{{ selected.shipment.destination }}</span></div>
            </div>

            <div class="mt-3">
              <div class="text-muted-foreground mb-1 flex items-center justify-between text-xs tabular-nums">
                <span>{{ selected.shipment.progress }}% complete</span>
                <span v-if="selected.distanceKm">{{ selected.distanceKm }} km</span>
              </div>
              <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div class="h-full rounded-full transition-[width] duration-500" :style="{ width: `${selected.shipment.progress}%`, background: TONE_BG[selected.tone] }" />
              </div>
            </div>

            <div class="mt-3 flex items-center justify-between border-t pt-3">
              <span class="text-muted-foreground text-xs">ETA {{ shortDate(selected.shipment.estimatedDelivery) }}</span>
              <NuxtLink :to="`/shipments/${selected.shipment.id}`" class="text-primary inline-flex items-center gap-0.5 text-xs font-medium hover:underline">View details<ChevronRight class="size-3" /></NuxtLink>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
