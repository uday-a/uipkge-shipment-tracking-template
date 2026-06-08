<script setup lang="ts">
/**
 * Inbound containers — the first leg of the Zepp supply chain. Ebikes are
 * built in China, loaded into ocean containers, and shipped to a US port,
 * then drayed to the nearest import warehouse. This board tracks each
 * container from departure → at sea → port → customs → received.
 * Dispatcher-gated.
 */
import { computed } from 'vue'
import { Ship, Anchor, Boxes, PackageCheck, ShieldAlert, ChevronRight } from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiGrid } from '@/components/ui/kpi-grid'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge, toneDot, shortDate } from '@/lib/utils'

import {
  CONTAINERS, CONTAINER_STATUS_LABELS, CONTAINER_STATUS_TONE, type ContainerStatus,
} from '~/mocks/containers'
import { locationName } from '~/mocks/network'
import { formatMoney } from '~/mocks/movements'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Inbound containers · Zepp' })

const ready = useDataReady(450)

// Worst-ETA / least-progress first, but received ones sink to the bottom.
const containers = computed(() =>
  [...CONTAINERS].sort((a, b) => {
    if ((a.status === 'received') !== (b.status === 'received')) return a.status === 'received' ? 1 : -1
    return a.progress - b.progress
  }),
)

const onWater = (s: ContainerStatus) => s === 'at-sea' || s === 'at-port' || s === 'inland'
const kpis = computed(() => ({
  inTransit: CONTAINERS.filter((c) => onWater(c.status)).length,
  bikesInbound: CONTAINERS.filter((c) => c.status !== 'received').reduce((sum, c) => sum + c.totalBikes, 0),
  inCustoms: CONTAINERS.filter((c) => c.status === 'customs').length,
  received: CONTAINERS.filter((c) => c.status === 'received').length,
}))
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Inbound containers</h1>
      <p class="text-muted-foreground text-xs">Ocean freight from the factory · China → US port → import warehouse.</p>
    </header>

    <KpiGrid v-if="ready">
      <KpiTile label="In transit" :value="kpis.inTransit" hint="On the water + drayage" tone="info" :icon="Ship" />
      <KpiTile label="Bikes inbound" :value="kpis.bikesInbound.toLocaleString()" hint="Not yet received" tone="info" :icon="Boxes" />
      <KpiTile label="In customs" :value="kpis.inCustoms" hint="Awaiting clearance" tone="warning" :icon="ShieldAlert" />
      <KpiTile label="Received" :value="kpis.received" hint="Landed at a hub" tone="success" :icon="PackageCheck" />
    </KpiGrid>
    <KpiGrid v-else>
      <Skeleton v-for="i in 4" :key="i" variant="rounded" class="h-[150px] w-full" />
    </KpiGrid>

    <Card>
      <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
        <div class="space-y-1">
          <CardTitle class="text-base">Container manifest</CardTitle>
          <CardDescription>Every inbound container + the bikes aboard</CardDescription>
        </div>
        <Badge variant="info" class="tabular-nums">{{ kpis.inTransit }} in transit</Badge>
      </CardHeader>
      <CardContent>
        <Table v-if="ready">
          <TableHeader>
            <TableRow>
              <TableHead>Container</TableHead>
              <TableHead>Vessel</TableHead>
              <TableHead>Lane</TableHead>
              <TableHead>Destination hub</TableHead>
              <TableHead class="text-right">Bikes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">ETA port</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="c in containers"
              :key="c.id"
              class="hover:bg-muted/50 cursor-pointer"
              @click="navigateTo(`/containers/${c.id}`)"
            >
              <TableCell>
                <NuxtLink
                  :to="`/containers/${c.id}`"
                  class="focus-visible:ring-ring flex flex-col rounded-sm leading-tight outline-none focus-visible:ring-2"
                  @click.stop
                >
                  <span class="font-medium">{{ c.id }}</span>
                  <span class="text-muted-foreground font-mono text-xs">{{ c.bookingRef }}</span>
                </NuxtLink>
              </TableCell>
              <TableCell>
                <span class="inline-flex items-center gap-1.5 text-sm">
                  <Anchor class="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />{{ c.vessel }}
                </span>
              </TableCell>
              <TableCell>
                <span class="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <span class="text-foreground font-medium">{{ c.originPortCode }}</span>
                  <ChevronRight class="size-3 shrink-0" aria-hidden="true" />
                  <span class="text-foreground font-medium">{{ c.destPortCode }}</span>
                </span>
              </TableCell>
              <TableCell>
                <span class="text-sm">{{ locationName(c.destWarehouseId) }}</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex flex-col items-end leading-tight">
                  <span class="font-semibold tabular-nums">{{ c.totalBikes.toLocaleString() }}</span>
                  <span class="text-muted-foreground text-xs">{{ formatMoney(c.valueUsd) }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="toneBadge(CONTAINER_STATUS_TONE[c.status])" class="gap-1.5">
                  <span :class="['size-1.5 rounded-full', toneDot(CONTAINER_STATUS_TONE[c.status])]" aria-hidden="true" />
                  {{ CONTAINER_STATUS_LABELS[c.status] }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <span class="text-xs tabular-nums" :class="c.status === 'received' ? 'text-success' : 'text-muted-foreground'">
                  {{ c.status === 'received' ? `Recv ${shortDate(c.receivedDate!)}` : shortDate(c.etaPort) }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div v-else class="space-y-2">
          <Skeleton v-for="i in 6" :key="i" class="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
