<script setup lang="ts">
/**
 * Control tower — live, exceptions-first command center.
 *
 * Where the Dashboard shows trends + aggregate KPIs, this surface answers
 * "what's on fire right now". Everything is derived from the shipment
 * ledger so it stays honest against the Shipments page (no hand-authored
 * duplicate numbers):
 *   - KPI strip: active / needs-attention / exceptions / out-for-delivery
 *   - Exceptions triage table: the delayed + exception rows, worst first,
 *     each with the *reason* it's stuck (parsed from lastLocation)
 *   - Network status: live status breakdown across the ledger
 *   - Live activity feed + what's landing today (out for delivery)
 *
 * No charts here on purpose — the Dashboard owns the chart-heavy view; the
 * control tower is tables, bars and lists you scan, not study.
 */
import { computed } from 'vue'
import {
  Package, TriangleAlert, OctagonAlert, MapPin, Search, ChevronRight,
  PackageCheck, Boxes, Truck, AlertTriangle, Clock, Plane,
} from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge, toneDot } from '@/lib/utils'

import { ACTIVITY, type ActivityEntry } from '~/mocks/dashboard'
import {
  SHIPMENTS, isActive, isException, TODAY,
  STATUS_LABELS, STATUS_TONE, PRIORITY_LABELS, PRIORITY_TONE,
  type Shipment, type Priority, type ShipmentStatus,
} from '~/mocks/shipments'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Control tower · Zepp' })

const ready = useDataReady(450)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const headerDate = computed(() => {
  const [y, m, d] = TODAY.split('-').map(Number)
  return `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`
})

// ── Live KPIs, derived from the ledger ──────────────────────────────
const byStatus = (st: ShipmentStatus) => SHIPMENTS.filter((s) => s.status === st).length
const kpis = computed(() => ({
  active: SHIPMENTS.filter(isActive).length,
  attention: SHIPMENTS.filter(isException).length,
  exceptions: byStatus('exception'),
  lastMile: byStatus('out-for-delivery'),
}))

// ── Exceptions triage: the delayed / exception rows, worst first ────
const PRIORITY_RANK: Record<Priority, number> = { critical: 3, high: 2, medium: 1, low: 0 }
const statusRank = (s: Shipment) => (s.status === 'exception' ? 1 : 0)
const triage = computed(() =>
  [...SHIPMENTS.filter(isException)].sort(
    (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || statusRank(b) - statusRank(a),
  ),
)
/** "Hartford, CT — weather hold" → "weather hold"; falls back to the location. */
function issueOf(s: Shipment): string {
  const parts = s.lastLocation.split(' — ')
  return parts[1] ?? parts[0] ?? '—'
}
const isPastDue = (s: Shipment) => s.estimatedDelivery < TODAY

// ── Network status: live breakdown across the ledger ────────────────
const FLOW: ShipmentStatus[] = ['in-transit', 'out-for-delivery', 'picked-up', 'pending', 'delayed', 'exception']
const breakdown = computed(() => FLOW.map((status) => ({ status, n: byStatus(status) })))
const breakdownMax = computed(() => Math.max(1, ...breakdown.value.map((b) => b.n)))

// ── Out for delivery — last mile landing today ──────────────────────
const lastMile = computed(() =>
  [...SHIPMENTS.filter((s) => s.status === 'out-for-delivery')].sort((a, b) => b.progress - a.progress),
)

// ── Live activity feed (shared event stream) ────────────────────────
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
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <!-- Header -->
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Control tower</h1>
        <p class="text-muted-foreground text-xs">
          What needs attention across the network · {{ headerDate }}.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <Badge variant="outline" class="gap-1.5 px-2 py-0.5 text-xs">
          <span class="bg-destructive size-1.5 rounded-full" aria-hidden="true" />
          {{ kpis.attention }} need attention
        </Badge>
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/shipments?status=exception"><TriangleAlert class="mr-2 size-4" />Review in ledger</NuxtLink>
        </Button>
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/tracking"><Search class="mr-2 size-4" />Track</NuxtLink>
        </Button>
      </div>
    </header>

    <!-- KPI band -->
    <KpiGrid v-if="ready">
      <KpiTile label="Active in network" :value="kpis.active" hint="Still moving" tone="info" :icon="Package" />
      <KpiTile label="Needs attention" :value="kpis.attention" hint="Delayed + exceptions" tone="warning" :icon="TriangleAlert" />
      <KpiTile label="Exceptions" :value="kpis.exceptions" hint="Held / damaged" tone="destructive" :icon="OctagonAlert" />
      <KpiTile label="Out for delivery" :value="kpis.lastMile" hint="Landing today" tone="info" :icon="MapPin" />
    </KpiGrid>
    <KpiGrid v-else>
      <Skeleton v-for="i in 4" :key="i" variant="rounded" class="h-[150px] w-full" />
    </KpiGrid>

    <!-- Exceptions triage + network status -->
    <div class="grid gap-4 lg:grid-cols-12">
      <Card class="lg:col-span-8 flex flex-col">
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <div class="space-y-1">
            <CardTitle class="text-base">Exceptions triage</CardTitle>
            <CardDescription>Delayed + held shipments — most critical first</CardDescription>
          </div>
          <Badge v-if="triage.length" variant="warning" class="tabular-nums">{{ triage.length }}</Badge>
        </CardHeader>
        <CardContent class="flex-1">
          <Table v-if="ready">
            <TableHeader>
              <TableRow>
                <TableHead>Shipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lane</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead class="text-right">ETA</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="s in triage"
                :key="s.id"
                class="hover:bg-muted/50 cursor-pointer"
                @click="navigateTo(`/shipments/${s.id}`)"
              >
                <TableCell>
                  <NuxtLink
                    :to="`/shipments/${s.id}`"
                    class="focus-visible:ring-ring flex flex-col rounded-sm leading-tight outline-none focus-visible:ring-2"
                    @click.stop
                  >
                    <span class="font-medium">{{ s.id }}</span>
                    <span class="text-muted-foreground font-mono text-xs">{{ s.customer }}</span>
                  </NuxtLink>
                </TableCell>
                <TableCell>
                  <Badge :variant="toneBadge(STATUS_TONE[s.status])" class="gap-1.5">
                    <span :class="['size-1.5 rounded-full', toneDot(STATUS_TONE[s.status])]" aria-hidden="true" />
                    {{ STATUS_LABELS[s.status] }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span class="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <span class="text-foreground font-medium">{{ s.originCode }}</span>
                    →
                    <span class="text-foreground font-medium">{{ s.destinationCode }}</span>
                  </span>
                </TableCell>
                <TableCell class="max-w-[16rem]">
                  <span class="truncate text-sm">{{ issueOf(s) }}</span>
                </TableCell>
                <TableCell class="text-right">
                  <span
                    class="text-xs tabular-nums"
                    :class="isPastDue(s) ? 'text-destructive font-medium' : 'text-muted-foreground'"
                  >
                    {{ isPastDue(s) ? 'Past due' : 'Today' }}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge :variant="toneBadge(PRIORITY_TONE[s.priority])" class="text-xs">
                    {{ PRIORITY_LABELS[s.priority] }}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableEmpty v-if="!triage.length" :colspan="6">
                No active exceptions — the network is clear.
              </TableEmpty>
            </TableBody>
          </Table>
          <div v-else class="space-y-2">
            <Skeleton v-for="i in 5" :key="i" class="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card class="lg:col-span-4 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Network status</CardTitle>
          <CardDescription>Live, across the ledger</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <ul class="space-y-3">
            <li v-for="b in breakdown" :key="b.status" class="space-y-1.5">
              <div class="flex items-center gap-2 text-sm">
                <span :class="['size-2 shrink-0 rounded-full', toneDot(STATUS_TONE[b.status])]" aria-hidden="true" />
                <span class="text-muted-foreground">{{ STATUS_LABELS[b.status] }}</span>
                <span class="ml-auto font-semibold tabular-nums">{{ b.n }}</span>
              </div>
              <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  :class="['h-full rounded-full', toneDot(STATUS_TONE[b.status])]"
                  :style="{ width: `${(b.n / breakdownMax) * 100}%` }"
                />
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <!-- Live activity + out for delivery -->
    <div class="grid gap-4 lg:grid-cols-12">
      <Card class="lg:col-span-8 flex flex-col">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Live activity</CardTitle>
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

      <Card class="lg:col-span-4 flex flex-col">
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <div class="space-y-1">
            <CardTitle class="text-base">Out for delivery</CardTitle>
            <CardDescription>Last mile, landing today</CardDescription>
          </div>
          <Badge variant="info" class="tabular-nums">{{ lastMile.length }}</Badge>
        </CardHeader>
        <CardContent class="flex-1 space-y-1">
          <NuxtLink
            v-for="s in lastMile"
            :key="s.id"
            :to="`/shipments/${s.id}`"
            class="hover:bg-muted/60 group block rounded-lg px-2 py-2 transition-colors"
          >
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium">{{ s.id }}</span>
              <span class="text-muted-foreground truncate text-xs">{{ s.destination }}</span>
              <ChevronRight class="text-muted-foreground ml-auto size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div class="mt-1.5 flex items-center gap-2">
              <div class="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                <div class="bg-primary h-full rounded-full" :style="{ width: `${s.progress}%` }" />
              </div>
              <span class="text-muted-foreground text-xs tabular-nums">{{ s.progress }}%</span>
            </div>
          </NuxtLink>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
