<script setup lang="ts">
/**
 * Drivers — roster card grid with status, rating, and live load.
 * Dispatcher-gated.
 */
import { ref, computed } from 'vue'
import { Star, Phone, MapPin, Truck, Users, CircleCheck, Package, Search, SearchX } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiGrid } from '@/components/ui/kpi-grid'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge } from '@/lib/utils'

import { DRIVERS, DRIVER_STATUS_LABELS, DRIVER_STATUS_TONE, driverActiveLoad } from '~/mocks/drivers'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Drivers · Zepp' })

const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return DRIVERS
  return DRIVERS.filter((d) => d.name.toLowerCase().includes(q) || d.homeBase.toLowerCase().includes(q))
})

const totals = computed(() => ({
  total: DRIVERS.length,
  onRoute: DRIVERS.filter((d) => d.status === 'on-route').length,
  available: DRIVERS.filter((d) => d.status === 'available').length,
  avgRating: (DRIVERS.reduce((a, d) => a + d.rating, 0) / DRIVERS.length).toFixed(1),
}))
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Drivers</h1>
        <p class="text-muted-foreground text-xs">{{ DRIVERS.length }} drivers · {{ totals.onRoute }} on route.</p>
      </div>
      <div class="relative w-full sm:w-64">
        <Search class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input v-model="search" aria-label="Search drivers" placeholder="Search drivers…" class="pl-9" />
      </div>
    </header>

    <KpiGrid>
      <KpiTile label="Total drivers" :value="totals.total" hint="On the roster" tone="info" :icon="Users" />
      <KpiTile label="On route" :value="totals.onRoute" hint="Delivering now" tone="info" :icon="Truck" />
      <KpiTile label="Available" :value="totals.available" hint="Ready to assign" tone="success" :icon="CircleCheck" />
      <KpiTile label="Avg rating" :value="totals.avgRating" hint="Out of 5.0" tone="success" :icon="Star" />
    </KpiGrid>

    <div v-if="filtered.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="d in filtered" :key="d.id" class="hover:border-foreground/20 transition-colors">
        <CardContent class="space-y-3 p-4">
          <div class="flex items-start gap-3">
            <Avatar class="size-11 ring-1 ring-border">
              <AvatarFallback class="text-sm font-semibold">{{ d.initials }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold leading-tight">{{ d.name }}</p>
              <p class="text-muted-foreground text-xs">{{ d.id }} · {{ d.license }}</p>
            </div>
            <Badge :variant="toneBadge(DRIVER_STATUS_TONE[d.status])" class="text-xs">{{ DRIVER_STATUS_LABELS[d.status] }}</Badge>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg py-1.5">
              <p class="text-sm font-semibold tabular-nums">{{ d.deliveriesToday }}</p>
              <p class="text-muted-foreground text-xs">Today</p>
            </div>
            <div class="bg-muted/50 rounded-lg py-1.5">
              <p class="text-sm font-semibold tabular-nums">{{ driverActiveLoad(d.name) }}</p>
              <p class="text-muted-foreground text-xs">Active</p>
            </div>
            <div class="bg-muted/50 rounded-lg py-1.5">
              <p class="inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums">
                <Star class="fill-warning text-warning size-3" />{{ d.rating }}
              </p>
              <p class="text-muted-foreground text-xs">Rating</p>
            </div>
          </div>

          <div class="text-muted-foreground space-y-1 text-xs">
            <p class="flex items-center gap-1.5"><MapPin class="size-3" />{{ d.homeBase }}</p>
            <p class="flex items-center gap-1.5"><Phone class="size-3" />{{ d.phone }}</p>
            <p v-if="d.vehicle" class="flex items-center gap-1.5"><Truck class="size-3" />{{ d.vehicle }} · {{ d.onTimeRate }}% on-time</p>
            <p v-else class="flex items-center gap-1.5"><Package class="size-3" />No vehicle assigned · {{ d.onTimeRate }}% on-time</p>
          </div>
        </CardContent>
      </Card>
    </div>
    <EmptyState
      v-else
      :icon="SearchX"
      title="No drivers match"
      :description="`No drivers match “${search}”.`"
      class="py-10"
    />
  </div>
</template>
