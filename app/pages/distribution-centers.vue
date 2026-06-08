<script setup lang="ts">
/**
 * Distribution centers — the local fulfilment tier. Each DC is replenished
 * from its parent import warehouse and ships last-mile orders to nearby
 * consumers. Dispatcher-gated.
 */
import { computed } from 'vue'
import { Store, Boxes, TriangleAlert, Gauge, ArrowUpRight } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiGrid } from '@/components/ui/kpi-grid'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge } from '@/lib/utils'

import {
  distributionCenters, locationName, LOCATION_STATUS_LABELS, LOCATION_STATUS_TONE,
} from '~/mocks/network'
import { locationOnHand } from '~/mocks/inventory'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Distribution centers · Zepp' })

const ready = useDataReady(400)

const dcs = computed(() =>
  [...distributionCenters()].sort((a, b) => b.capacityPct - a.capacityPct),
)

const kpis = computed(() => {
  const list = distributionCenters()
  const onHand = list.reduce((sum, d) => sum + locationOnHand(d.id), 0)
  const avgCap = Math.round(list.reduce((sum, d) => sum + d.capacityPct, 0) / Math.max(1, list.length))
  return {
    count: list.length,
    nearCapacity: list.filter((d) => d.status === 'near-capacity').length,
    onHand,
    avgCap,
  }
})

const capTone = (pct: number) => (pct >= 90 ? 'text-warning' : 'text-muted-foreground')
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Distribution centers</h1>
      <p class="text-muted-foreground text-xs">Local fulfilment hubs · replenished from import warehouses, deliver last-mile to consumers.</p>
    </header>

    <KpiGrid v-if="ready">
      <KpiTile label="Distribution centers" :value="kpis.count" hint="Across the network" tone="info" :icon="Store" />
      <KpiTile label="Bikes on hand" :value="kpis.onHand.toLocaleString()" hint="Available to fulfil" tone="success" :icon="Boxes" />
      <KpiTile label="Near capacity" :value="kpis.nearCapacity" hint="Flagged for replenishment" tone="warning" :icon="TriangleAlert" />
      <KpiTile label="Avg utilisation" :value="`${kpis.avgCap}%`" hint="Floor space" tone="info" :icon="Gauge" />
    </KpiGrid>
    <KpiGrid v-else>
      <Skeleton v-for="i in 4" :key="i" variant="rounded" class="h-[150px] w-full" />
    </KpiGrid>

    <div v-if="ready" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="d in dcs" :key="d.id" class="hover:border-foreground/20 transition-colors">
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-0.5">
              <CardTitle class="text-base">{{ d.name }}</CardTitle>
              <CardDescription>{{ d.city }} · {{ d.code }}</CardDescription>
            </div>
            <Badge :variant="toneBadge(LOCATION_STATUS_TONE[d.status])" class="shrink-0 text-xs">
              {{ LOCATION_STATUS_LABELS[d.status] }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <ArrowUpRight class="size-3.5 shrink-0 rotate-180" aria-hidden="true" />
            Supplied by <span class="text-foreground font-medium">{{ locationName(d.parentId!) }}</span>
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Capacity</span>
              <span :class="['font-medium tabular-nums', capTone(d.capacityPct)]">{{ d.capacityPct }}%</span>
            </div>
            <Progress :model-value="d.capacityPct" class="h-1.5" />
          </div>
          <div class="grid grid-cols-3 gap-2 pt-1 text-center">
            <div>
              <p class="text-muted-foreground text-[10px] uppercase tracking-wide">On hand</p>
              <p class="text-sm font-semibold tabular-nums">{{ locationOnHand(d.id).toLocaleString() }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Out today</p>
              <p class="text-sm font-semibold tabular-nums">{{ d.outboundToday }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Staff</p>
              <p class="text-sm font-semibold tabular-nums">{{ d.staff }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" variant="rounded" class="h-[210px] w-full" />
    </div>
  </div>
</template>
