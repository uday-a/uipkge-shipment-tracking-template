<script setup lang="ts">
/**
 * Analytics — network performance over the trailing year. Dispatcher-gated.
 */
import { computed } from 'vue'
import { Package, Gauge, Clock, DollarSign } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { AreaChart } from '@/components/ui/charts/area-chart'
import { BarChart } from '@/components/ui/charts/bar-chart'
import { PieChart } from '@/components/ui/charts/pie-chart'
import KpiTile from '@/components/KpiTile.vue'

import {
  MONTHLY, SERVICE_MIX, EXCEPTION_REASONS, TOP_LANES, WEEKLY_VOLUME,
} from '~/mocks/analytics'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Analytics · ShipTrack' })

const ready = useDataReady(450)

const totals = computed(() => {
  const shipments = MONTHLY.reduce((a, m) => a + m.shipments, 0)
  const last = MONTHLY[MONTHLY.length - 1]!
  return {
    shipments,
    onTime: last.onTime,
    transit: last.avgTransitHrs,
    cost: last.costPerShipment,
  }
})

const volumeData = computed(() => MONTHLY.map((m) => ({ month: m.month, Shipments: m.shipments })))
const onTimeData = computed(() => MONTHLY.map((m) => ({ month: m.month, 'On-time %': m.onTime })))
const onTimeOption = { yAxis: { min: 88, max: 96 } }
const exceptionData = computed(() => EXCEPTION_REASONS.map((e) => ({ reason: e.reason, Count: e.count })))
const weeklyData = computed(() => WEEKLY_VOLUME.map((d) => ({ day: d.day, Inbound: d.inbound, Outbound: d.outbound })))
const serviceOption = computed(() => ({ color: SERVICE_MIX.map((s) => s.color), legend: { show: false } }))

const maxLane = computed(() => Math.max(...TOP_LANES.map((l) => l.shipments)))
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-xl font-semibold tracking-tight">Analytics</h1>
      <p class="text-muted-foreground text-xs">Network performance over the trailing 12 months.</p>
    </header>

    <KpiGrid>
      <KpiTile label="Shipments (12mo)" :value="totals.shipments.toLocaleString()" hint="Total handled" tone="info" :icon="Package" />
      <KpiTile label="On-time rate" :value="`${totals.onTime}%`" hint="Latest month" tone="success" :icon="Gauge" />
      <KpiTile label="Avg transit" :value="`${totals.transit}h`" hint="Door to door" tone="info" :icon="Clock" />
      <KpiTile label="Cost / shipment" :value="`$${totals.cost}`" hint="Blended" tone="warning" :icon="DollarSign" />
    </KpiGrid>

    <div class="grid gap-3 lg:grid-cols-12">
      <Card class="lg:col-span-8 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Monthly volume</CardTitle>
          <CardDescription>Shipments handled per month</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ClientOnly>
            <AreaChart v-if="ready" role="img" aria-label="Area chart: shipments handled per month" :data="volumeData" x-field="month" y-field="Shipments" :height="260" />
            <Skeleton v-else class="h-[260px] w-full" />
            <template #fallback><Skeleton class="h-[260px] w-full" /></template>
          </ClientOnly>
        </CardContent>
      </Card>

      <Card class="lg:col-span-4 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Service mix</CardTitle>
          <CardDescription>By volume</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ClientOnly>
            <PieChart v-if="ready" role="img" aria-label="Donut chart: service mix by volume" :data="SERVICE_MIX" :donut="true" :option="serviceOption" :height="200" />
            <Skeleton v-else class="h-[200px] w-full" />
            <template #fallback><Skeleton class="h-[200px] w-full" /></template>
          </ClientOnly>
          <ul class="mt-2 space-y-1">
            <li v-for="s in SERVICE_MIX" :key="s.name" class="flex items-center gap-1.5 text-xs">
              <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: s.color }" />
              <span class="text-muted-foreground">{{ s.name }}</span>
              <span class="ml-auto font-semibold tabular-nums">{{ s.value.toLocaleString() }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-3 lg:grid-cols-12">
      <Card class="lg:col-span-6 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">On-time trend</CardTitle>
          <CardDescription>Percentage delivered on schedule</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ClientOnly>
            <AreaChart v-if="ready" role="img" aria-label="Area chart: percentage of shipments delivered on schedule by month" :data="onTimeData" x-field="month" y-field="On-time %" :option="onTimeOption" :height="220" />
            <Skeleton v-else class="h-[220px] w-full" />
            <template #fallback><Skeleton class="h-[220px] w-full" /></template>
          </ClientOnly>
        </CardContent>
      </Card>

      <Card class="lg:col-span-6 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Exception reasons</CardTitle>
          <CardDescription>Last 90 days</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ClientOnly>
            <BarChart v-if="ready" role="img" aria-label="Bar chart: exception counts by reason over the last 90 days" :data="exceptionData" x-field="reason" y-field="Count" :height="220" />
            <Skeleton v-else class="h-[220px] w-full" />
            <template #fallback><Skeleton class="h-[220px] w-full" /></template>
          </ClientOnly>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-3 lg:grid-cols-12">
      <Card class="lg:col-span-7">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Top lanes</CardTitle>
          <CardDescription>By shipment volume</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2.5">
          <div v-for="l in TOP_LANES" :key="l.lane" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ l.lane }}</span>
              <span class="text-muted-foreground tabular-nums">
                {{ l.shipments }} · <span :class="l.onTime >= 95 ? 'text-success' : l.onTime < 90 ? 'text-warning' : ''">{{ l.onTime }}%</span> · {{ l.avgHrs }}h
              </span>
            </div>
            <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div class="bg-primary h-full rounded-full" :style="`width:${Math.round((l.shipments / maxLane) * 100)}%`" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="lg:col-span-5 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Weekly throughput</CardTitle>
          <CardDescription>Inbound vs outbound</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ClientOnly>
            <BarChart v-if="ready" role="img" aria-label="Bar chart: weekly inbound versus outbound volume" :data="weeklyData" x-field="day" :y-field="['Inbound', 'Outbound']" :height="220" />
            <Skeleton v-else class="h-[220px] w-full" />
            <template #fallback><Skeleton class="h-[220px] w-full" /></template>
          </ClientOnly>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
