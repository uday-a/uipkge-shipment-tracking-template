<script setup lang="ts">
/**
 * Operations overview — the trends + performance home for the current persona.
 *
 * Top to bottom: greeting + quick actions, KPI band, volume trend +
 * status mix, carrier scorecard + regional split, then the live activity
 * feed alongside quick actions. Aggregate KPIs come from the dashboard
 * mock; the "today" highlight numbers are derived live from the shipment
 * ledger so they stay honest against the Shipments page.
 */
import { computed } from 'vue'
import {
  Package, CircleCheck, Truck, TriangleAlert, PackagePlus, Search,
  ArrowRight, MapPin, AlertTriangle, Clock, PackageCheck,
  Boxes, Plane, ChevronRight, Ship,
} from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { AreaChart } from '@/components/ui/charts/area-chart'
import { BarChart } from '@/components/ui/charts/bar-chart'
import { PieChart } from '@/components/ui/charts/pie-chart'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import KpiTile from '@/components/KpiTile.vue'

import {
  KPI_TILES, SHIPMENT_VOLUME, STATUS_SPLIT, CARRIER_PERFORMANCE,
  DELIVERY_BY_REGION, ACTIVITY, QUICK_ACTIONS, type ActivityEntry,
} from '~/mocks/dashboard'
import { SHIPMENTS, isActive, isException, TODAY, STATUS_LABELS, STATUS_TONE } from '~/mocks/shipments'

useHead({ title: 'Dashboard · Zepp' })

const { current: persona, isDispatcher } = usePersona()
const ready = useDataReady(450)

const KPI_ICON_MAP = { Package, CircleCheck, Truck, TriangleAlert } as const

// ── Live "today" highlights, derived from the shipment ledger ──────────
const live = computed(() => {
  const active = SHIPMENTS.filter(isActive).length
  const exceptions = SHIPMENTS.filter(isException).length
  return { active, exceptions }
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const headerDate = computed(() => {
  const [y, m, d] = TODAY.split('-').map(Number)
  return `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`
})

const sparkMonths = computed(() => SHIPMENT_VOLUME.map((p) => p.month))

// Volume trend: shipments booked vs delivered, last 12 months.
const volumeData = computed(() =>
  SHIPMENT_VOLUME.map((p) => ({ month: p.month, Shipments: p.shipments, Delivered: p.delivered })),
)

// Status donut uses the mock's hand-picked semantic colors.
const statusOption = computed(() => ({
  color: STATUS_SPLIT.map((s) => s.color),
  legend: { show: false },
  series: [{ radius: ['52%', '82%'], label: { show: false } }],
}))
const statusTotal = computed(() => STATUS_SPLIT.reduce((a, b) => a + b.value, 0))

const regionData = computed(() => DELIVERY_BY_REGION.map((r) => ({ region: r.region, Deliveries: r.value })))

// Activity feed icon + tone per event type.
const activityMeta = (type: ActivityEntry['type']) => {
  switch (type) {
    case 'delivered': return { icon: PackageCheck, tone: 'text-success', ring: 'bg-success/10' }
    case 'picked-up': return { icon: Boxes, tone: 'text-info', ring: 'bg-info/10' }
    case 'departed': return { icon: Truck, tone: 'text-info', ring: 'bg-info/10' }
    case 'out-for-delivery': return { icon: MapPin, tone: 'text-info', ring: 'bg-info/10' }
    case 'exception': return { icon: AlertTriangle, tone: 'text-destructive', ring: 'bg-destructive/10' }
    case 'delayed': return { icon: Clock, tone: 'text-warning', ring: 'bg-warning/10' }
    case 'customs': return { icon: Plane, tone: 'text-muted-foreground', ring: 'bg-muted' }
    default: return { icon: Package, tone: 'text-muted-foreground', ring: 'bg-muted' }
  }
}

function activityTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const ACTION_ICON_MAP = { PackagePlus, Search, TriangleAlert, Truck, Ship } as const
const visibleActions = computed(() =>
  QUICK_ACTIONS.filter((a) => !a.requires || (a.requires === 'dispatcher' ? isDispatcher.value : persona.value === 'admin')),
)

// Exceptions list for the right column — the ledger rows that need eyes.
const exceptionRows = computed(() => SHIPMENTS.filter(isException).slice(0, 5))
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <!-- Header -->
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Operations overview
        </h1>
        <p class="text-muted-foreground text-xs">
          Network trends and performance · {{ headerDate }}.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <Badge variant="outline" class="gap-1.5 px-2 py-0.5 text-xs">
          <span class="bg-success size-1.5 rounded-full" aria-hidden="true" />
          {{ live.active }} active · {{ live.exceptions }} need attention
        </Badge>
        <Button v-if="isDispatcher" size="sm" as-child>
          <NuxtLink to="/shipments/new"><PackagePlus class="mr-2 size-4" />New shipment</NuxtLink>
        </Button>
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/tracking"><Search class="mr-2 size-4" />Track</NuxtLink>
        </Button>
      </div>
    </header>

    <!-- KPI band -->
    <KpiGrid v-if="ready">
      <KpiTile
        v-for="tile in KPI_TILES"
        :key="tile.label"
        :label="tile.label"
        :value="tile.value"
        :delta="tile.delta"
        :spark="tile.spark"
        :spark-labels="tile.spark && tile.spark.length === sparkMonths.length ? sparkMonths : undefined"
        :hint="tile.hint"
        :tone="tile.tone"
        :icon="KPI_ICON_MAP[tile.icon as keyof typeof KPI_ICON_MAP]"
      />
    </KpiGrid>
    <KpiGrid v-else>
      <Skeleton v-for="i in 4" :key="i" variant="rounded" class="h-[150px] w-full" />
    </KpiGrid>

    <!-- Volume trend + status mix -->
    <div class="grid gap-4 lg:grid-cols-12">
      <Card class="lg:col-span-8 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Shipment volume</CardTitle>
          <CardDescription>Booked vs delivered — trailing 12 months</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ClientOnly>
            <AreaChart
              v-if="ready"
              role="img"
              aria-label="Area chart: booked versus delivered shipment volume over the trailing 12 months"
              :data="volumeData"
              x-field="month"
              :y-field="['Shipments', 'Delivered']"
              :height="260"
            />
            <Skeleton v-else class="h-[260px] w-full" />
            <template #fallback><Skeleton class="h-[260px] w-full" /></template>
          </ClientOnly>
        </CardContent>
      </Card>

      <Card class="lg:col-span-4 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Status mix</CardTitle>
          <CardDescription>Network status · today</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <div class="relative">
            <ClientOnly>
              <PieChart
                v-if="ready"
                role="img"
                aria-label="Donut chart: shipment status mix across the active network"
                :data="STATUS_SPLIT"
                :donut="true"
                :option="statusOption"
                :height="200"
              />
              <Skeleton v-else class="h-[200px] w-full" />
              <template #fallback><Skeleton class="h-[200px] w-full" /></template>
            </ClientOnly>
            <div v-if="ready" class="pointer-events-none absolute inset-x-0 top-[78px] text-center">
              <p class="text-2xl font-semibold tabular-nums leading-none">{{ statusTotal.toLocaleString() }}</p>
              <p class="text-muted-foreground text-xs">shipments</p>
            </div>
          </div>
          <ul class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            <li v-for="s in STATUS_SPLIT" :key="s.name" class="flex items-center gap-1.5 text-xs">
              <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: s.color }" />
              <span class="text-muted-foreground truncate">{{ s.name }}</span>
              <span class="ml-auto font-semibold tabular-nums">{{ s.value }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <!-- Carrier scorecard + region split -->
    <div class="grid gap-4 lg:grid-cols-12">
      <Card class="lg:col-span-7">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Carrier scorecard</CardTitle>
          <CardDescription>On-time performance + active volume</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="c in CARRIER_PERFORMANCE" :key="c.carrier" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ c.carrier }}</span>
              <span class="text-muted-foreground tabular-nums">
                <span :class="c.onTime >= 95 ? 'text-success font-semibold' : c.onTime < 90 ? 'text-warning font-semibold' : 'text-foreground font-semibold'">{{ c.onTime }}%</span>
                · {{ c.volume }} active
              </span>
            </div>
            <Progress :model-value="c.onTime" class="h-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card class="lg:col-span-5 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Deliveries by region</CardTitle>
          <CardDescription>Today</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ClientOnly>
            <BarChart
              v-if="ready"
              role="img"
              aria-label="Bar chart: deliveries by region today"
              :data="regionData"
              x-field="region"
              y-field="Deliveries"
              :height="200"
            />
            <Skeleton v-else class="h-[200px] w-full" />
            <template #fallback><Skeleton class="h-[200px] w-full" /></template>
          </ClientOnly>
        </CardContent>
      </Card>
    </div>

    <!-- Activity + exceptions / quick actions -->
    <div class="grid gap-4 lg:grid-cols-12">
      <Card class="lg:col-span-8 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Recent activity</CardTitle>
          <CardDescription>Network events, newest first</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <OverlayScroll class="max-h-[320px]">
            <ul class="space-y-0.5 pr-2">
              <li
                v-for="a in ACTIVITY"
                :key="a.id"
                class="hover:bg-muted/50 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
              >
                <span :class="['mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full', activityMeta(a.type).ring]">
                  <component :is="activityMeta(a.type).icon" :class="['size-3.5', activityMeta(a.type).tone]" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm leading-snug">{{ a.text }}</p>
                  <p class="text-muted-foreground text-xs">{{ a.actor.name }} · {{ activityTime(a.timeUtc) }} UTC</p>
                </div>
                <Badge v-if="a.meta" variant="secondary" class="shrink-0 text-xs">{{ a.meta }}</Badge>
              </li>
            </ul>
          </OverlayScroll>
        </CardContent>
      </Card>

      <div class="lg:col-span-4 space-y-3">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent class="space-y-1.5">
            <NuxtLink
              v-for="action in visibleActions"
              :key="action.label"
              :to="action.to"
              class="hover:bg-muted/60 group flex items-center gap-3 rounded-lg border p-2.5 transition-colors"
            >
              <span class="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                <component :is="ACTION_ICON_MAP[action.icon as keyof typeof ACTION_ICON_MAP]" class="size-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium leading-tight">{{ action.label }}</p>
                <p class="text-muted-foreground truncate text-xs">{{ action.description }}</p>
              </div>
              <ArrowRight class="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </NuxtLink>
          </CardContent>
        </Card>

        <Card v-if="isDispatcher">
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-base">Needs attention</CardTitle>
            <Badge variant="warning">{{ live.exceptions }}</Badge>
          </CardHeader>
          <CardContent class="space-y-1">
            <NuxtLink
              v-for="s in exceptionRows"
              :key="s.id"
              :to="`/shipments/${s.id}`"
              class="hover:bg-muted/60 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
            >
              <span
                class="size-1.5 shrink-0 rounded-full"
                :class="STATUS_TONE[s.status] === 'destructive' ? 'bg-destructive' : 'bg-warning'"
              />
              <span class="font-medium">{{ s.id }}</span>
              <span class="text-muted-foreground truncate text-xs">{{ STATUS_LABELS[s.status] }}</span>
              <ChevronRight class="text-muted-foreground ml-auto size-3.5 shrink-0" />
            </NuxtLink>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
