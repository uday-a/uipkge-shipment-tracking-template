<script setup lang="ts">
/**
 * Network routes / lanes. Each card shows the lane, its status, distance,
 * assigned driver + vehicle, and the live shipment load riding it.
 * Dispatcher-gated.
 */
import { computed } from 'vue'
import { Route, ArrowRight, MapPin, Truck, User, Clock, Package, Activity, AlertTriangle } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KpiGrid } from '@/components/ui/kpi-grid'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge } from '@/lib/utils'

import { ROUTES, ROUTE_STATUS_LABELS, ROUTE_STATUS_TONE, routeLoad } from '~/mocks/routes'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Routes · ShipTrack' })

const totals = computed(() => ({
  total: ROUTES.length,
  active: ROUTES.filter((r) => r.status === 'active').length,
  disrupted: ROUTES.filter((r) => r.status === 'disrupted').length,
  avgKm: Math.round(ROUTES.reduce((a, r) => a + r.distanceKm, 0) / ROUTES.length),
}))
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <header>
      <h1 class="text-xl font-bold tracking-tight">Routes</h1>
      <p class="text-muted-foreground text-xs">{{ ROUTES.length }} lanes · {{ totals.active }} active.</p>
    </header>

    <KpiGrid>
      <KpiTile label="Total lanes" :value="totals.total" hint="In the network" tone="info" :icon="Route" />
      <KpiTile label="Active" :value="totals.active" hint="Running now" tone="success" :icon="Activity" />
      <KpiTile label="Disrupted" :value="totals.disrupted" hint="Need rerouting" tone="warning" :icon="AlertTriangle" />
      <KpiTile label="Avg distance" :value="`${totals.avgKm} km`" hint="Per lane" tone="info" :icon="MapPin" />
    </KpiGrid>

    <div class="grid gap-3 md:grid-cols-2">
      <Card v-for="r in ROUTES" :key="r.id" class="hover:border-foreground/20 transition-colors">
        <CardContent class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-semibold leading-tight">{{ r.name }}</p>
              <p class="text-muted-foreground text-xs font-mono">{{ r.id }}</p>
            </div>
            <Badge :variant="toneBadge(ROUTE_STATUS_TONE[r.status])" class="text-xs">{{ ROUTE_STATUS_LABELS[r.status] }}</Badge>
          </div>

          <!-- Lane visual -->
          <div class="flex items-center gap-2 text-sm">
            <span class="font-medium">{{ r.origin }}</span>
            <div class="relative flex-1">
              <div class="bg-border h-px w-full" />
              <span class="bg-background text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-1 text-xs">
                {{ r.stops }} stops
              </span>
            </div>
            <ArrowRight class="text-muted-foreground size-4" />
            <span class="font-medium">{{ r.destination }}</span>
          </div>

          <div class="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <p class="flex items-center gap-1.5"><MapPin class="size-3" />{{ r.distanceKm }} km</p>
            <p class="flex items-center gap-1.5"><Clock class="size-3" />~{{ r.avgHours }}h transit</p>
            <p class="flex items-center gap-1.5"><User class="size-3" />{{ r.driver ?? 'Unassigned' }}</p>
            <p class="flex items-center gap-1.5"><Truck class="size-3" />{{ r.vehicle ?? '—' }}</p>
          </div>

          <div class="flex items-center justify-between border-t pt-2">
            <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <Package class="size-3.5" />Active shipments
            </span>
            <span class="text-sm font-semibold tabular-nums">{{ routeLoad(r.id) }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
