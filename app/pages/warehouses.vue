<script setup lang="ts">
/**
 * Warehouses — distribution-center network with capacity + throughput.
 * Dispatcher-gated.
 */
import { computed } from 'vue'
import { Warehouse, ArrowDownToLine, ArrowUpFromLine, Users, MapPin } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { KpiGrid } from '@/components/ui/kpi-grid'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge } from '@/lib/utils'

import { WAREHOUSES, WAREHOUSE_STATUS_LABELS, WAREHOUSE_STATUS_TONE } from '~/mocks/warehouses'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Warehouses · ShipTrack' })

const totals = computed(() => ({
  count: WAREHOUSES.length,
  inbound: WAREHOUSES.reduce((a, w) => a + w.inboundToday, 0),
  outbound: WAREHOUSES.reduce((a, w) => a + w.outboundToday, 0),
  avgCap: Math.round(WAREHOUSES.reduce((a, w) => a + w.capacityPct, 0) / WAREHOUSES.length),
}))
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <header>
      <h1 class="text-xl font-bold tracking-tight">Warehouses</h1>
      <p class="text-muted-foreground text-xs">{{ WAREHOUSES.length }} distribution centers across the network.</p>
    </header>

    <KpiGrid>
      <KpiTile label="Facilities" :value="totals.count" hint="Hubs + DCs" tone="info" :icon="Warehouse" />
      <KpiTile label="Inbound today" :value="totals.inbound" hint="Receipts" tone="info" :icon="ArrowDownToLine" />
      <KpiTile label="Outbound today" :value="totals.outbound" hint="Dispatches" tone="success" :icon="ArrowUpFromLine" />
      <KpiTile label="Avg capacity" :value="`${totals.avgCap}%`" hint="Utilization" tone="warning" :icon="Warehouse" />
    </KpiGrid>

    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="w in WAREHOUSES" :key="w.id" class="hover:border-foreground/20 transition-colors">
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <CardTitle class="text-base">{{ w.name }}</CardTitle>
              <CardDescription class="flex items-center gap-1"><MapPin class="size-3" />{{ w.city }} · {{ w.code }}</CardDescription>
            </div>
            <Badge :variant="toneBadge(WAREHOUSE_STATUS_TONE[w.status])" class="shrink-0 text-xs">{{ WAREHOUSE_STATUS_LABELS[w.status] }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <div>
            <div class="mb-1 flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Capacity</span>
              <span :class="['font-semibold tabular-nums', w.capacityPct >= 90 ? 'text-warning' : '']">{{ w.capacityPct }}%</span>
            </div>
            <Progress :model-value="w.capacityPct" class="h-1.5" />
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p class="text-sm font-bold tabular-nums">{{ w.inboundToday }}</p>
              <p class="text-muted-foreground">In</p>
            </div>
            <div>
              <p class="text-sm font-bold tabular-nums">{{ w.outboundToday }}</p>
              <p class="text-muted-foreground">Out</p>
            </div>
            <div>
              <p class="inline-flex items-center gap-0.5 text-sm font-bold tabular-nums">
                <Users class="size-3" />{{ w.staff }}
              </p>
              <p class="text-muted-foreground">Staff</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
