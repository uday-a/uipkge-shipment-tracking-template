<script setup lang="ts">
/**
 * Catalog — the Zepp ebike line. Each model is referenced by SKU across
 * containers, inventory and orders. Shows specs, price, and live on-hand
 * stock pulled from the network. Dispatcher-gated.
 */
import { computed } from 'vue'
import { Bike, Boxes, Gauge, DollarSign, Battery, Weight, Zap } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiGrid } from '@/components/ui/kpi-grid'
import KpiTile from '@/components/KpiTile.vue'

import { CATALOG, SEGMENT_LABELS } from '~/mocks/catalog'
import { skuOnHand } from '~/mocks/inventory'
import { formatMoney } from '~/mocks/movements'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Catalog · Zepp' })

const ready = useDataReady(400)

const models = computed(() =>
  CATALOG.map((m) => ({ ...m, onHand: skuOnHand(m.sku) })),
)

const kpis = computed(() => ({
  models: CATALOG.length,
  onHand: models.value.reduce((sum, m) => sum + m.onHand, 0),
  avgPrice: Math.round(CATALOG.reduce((sum, m) => sum + m.msrpUsd, 0) / CATALOG.length),
  segments: new Set(CATALOG.map((m) => m.segment)).size,
}))
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Catalog</h1>
      <p class="text-muted-foreground text-xs">The Zepp ebike line · {{ kpis.models }} models across {{ kpis.segments }} segments.</p>
    </header>

    <KpiGrid v-if="ready">
      <KpiTile label="Models" :value="kpis.models" hint="Active SKUs" tone="info" :icon="Bike" />
      <KpiTile label="Units on hand" :value="kpis.onHand.toLocaleString()" hint="Network-wide" tone="success" :icon="Boxes" />
      <KpiTile label="Avg price" :value="formatMoney(kpis.avgPrice)" hint="MSRP" tone="info" :icon="DollarSign" />
      <KpiTile label="Segments" :value="kpis.segments" hint="Commuter → cargo" tone="info" :icon="Gauge" />
    </KpiGrid>
    <KpiGrid v-else>
      <Skeleton v-for="i in 4" :key="i" variant="rounded" class="h-[150px] w-full" />
    </KpiGrid>

    <div v-if="ready" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="m in models" :key="m.sku" class="hover:border-foreground/20 overflow-hidden transition-colors">
        <div class="h-1.5 w-full" :style="{ backgroundColor: m.color }" aria-hidden="true" />
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-0.5">
              <CardTitle class="text-base">{{ m.name }}</CardTitle>
              <CardDescription class="font-mono text-xs">{{ m.sku }}</CardDescription>
            </div>
            <Badge variant="secondary" class="shrink-0 text-xs">{{ SEGMENT_LABELS[m.segment] }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-baseline justify-between">
            <span class="text-2xl font-semibold tabular-nums">{{ formatMoney(m.msrpUsd) }}</span>
            <span class="text-muted-foreground text-xs">MSRP</span>
          </div>
          <div class="border-border grid grid-cols-3 gap-2 border-t pt-3 text-center">
            <div>
              <Battery class="text-muted-foreground mx-auto size-4" aria-hidden="true" />
              <p class="mt-1 text-sm font-semibold tabular-nums">{{ m.rangeMiles }}mi</p>
              <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Range</p>
            </div>
            <div>
              <Zap class="text-muted-foreground mx-auto size-4" aria-hidden="true" />
              <p class="mt-1 text-sm font-semibold tabular-nums">{{ m.topSpeedMph }}mph</p>
              <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Top speed</p>
            </div>
            <div>
              <Weight class="text-muted-foreground mx-auto size-4" aria-hidden="true" />
              <p class="mt-1 text-sm font-semibold tabular-nums">{{ m.weightKg }}kg</p>
              <p class="text-muted-foreground text-[10px] uppercase tracking-wide">Weight</p>
            </div>
          </div>
          <div class="flex items-center justify-between border-t border-border pt-2 text-sm">
            <span class="text-muted-foreground inline-flex items-center gap-1.5">
              <Boxes class="size-3.5" aria-hidden="true" />On hand
            </span>
            <span class="font-semibold tabular-nums">{{ m.onHand.toLocaleString() }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" variant="rounded" class="h-[280px] w-full" />
    </div>
  </div>
</template>
