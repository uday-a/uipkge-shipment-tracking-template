<script setup lang="ts">
/**
 * Live tracking — a trip list beside a live fleet map (inspired by the
 * classic logistics control-tower split view). Selecting a trip in the
 * list highlights its route + truck on the map, and vice-versa. Drivers
 * and Vehicles tabs reuse the fleet mocks. Dispatcher-gated.
 */
import { ref, computed } from 'vue'
import { Package, Target, MapPin, Truck, ChevronRight, Star } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import LiveMap from '@/components/LiveMap.vue'
import LiveMapMapbox from '@/components/LiveMapMapbox.vue'
import { toneBadge, shortDate } from '@/lib/utils'

import { resolvedTrips } from '~/mocks/live'
import { STATUS_LABELS, STATUS_TONE } from '~/mocks/shipments'
import { DRIVERS, DRIVER_STATUS_LABELS, DRIVER_STATUS_TONE } from '~/mocks/drivers'
import { VEHICLES, VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS, VEHICLE_STATUS_TONE } from '~/mocks/fleet'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Live tracking · ShipTrack' })

const trips = resolvedTrips()
const selectedId = ref<string | null>(null)
function select(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

const drivers = computed(() => [...DRIVERS].sort((a, b) => (a.status === 'on-route' ? -1 : 1)))
const vehicles = computed(() => VEHICLES.filter((v) => v.status === 'active'))
</script>

<template>
  <div class="flex h-[calc(100svh-3.5rem)] flex-col lg:flex-row">
    <!-- List rail -->
    <aside class="bg-background flex w-full shrink-0 flex-col border-b lg:w-[384px] lg:border-b-0 lg:border-r">
      <div class="px-4 pt-4">
        <h1 class="text-lg font-bold tracking-tight">Live tracking</h1>
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

                <div class="mt-3 flex items-center justify-between border-t pt-2">
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
    </div>
  </div>
</template>
