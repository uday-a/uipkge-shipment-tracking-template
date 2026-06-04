<script setup lang="ts">
/**
 * Stock — bikes on hand per model × location across the whole network.
 * Import warehouses hold the bulk (fed by received containers); distribution
 * centers hold smaller buffers (drawn down by last-mile orders). Rows flagged
 * when a DC's available stock runs low. Dispatcher-gated.
 */
import { computed } from 'vue'
import { Boxes, PackageX, Bike, DollarSign } from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import KpiTile from '@/components/KpiTile.vue'

import { CATALOG } from '~/mocks/catalog'
import { NETWORK } from '~/mocks/network'
import {
  STOCK_SKUS, onHandAt, locationOnHand, networkOnHand, skuOnHand, lowStock,
} from '~/mocks/inventory'
import { formatMoney } from '~/mocks/movements'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Stock · Zepp' })

const ready = useDataReady(400)

// Warehouses first, then DCs — the order stock flows through the network.
const rows = computed(() =>
  [...NETWORK].sort((a, b) => (a.type === b.type ? 0 : a.type === 'warehouse' ? -1 : 1)),
)

/** "Zepp City" → "City" for compact column headers. */
const shortName = (name: string) => name.replace(/^Zepp\s+/, '')

const retailValue = computed(() =>
  CATALOG.reduce((sum, m) => sum + skuOnHand(m.sku) * m.msrpUsd, 0),
)

const kpis = computed(() => ({
  onHand: networkOnHand(),
  lowStock: new Set(lowStock().map((r) => r.locationId)).size,
  models: CATALOG.length,
  value: retailValue.value,
}))

const cellTone = (loc: { type: string }, n: number) =>
  loc.type === 'dc' && n <= 10 ? 'text-warning font-semibold' : ''
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Stock</h1>
      <p class="text-muted-foreground text-xs">Bikes on hand per model, across import warehouses + distribution centers.</p>
    </header>

    <KpiGrid v-if="ready">
      <KpiTile label="Bikes on hand" :value="kpis.onHand.toLocaleString()" hint="Network-wide" tone="info" :icon="Boxes" />
      <KpiTile label="Models" :value="kpis.models" hint="In the catalog" tone="info" :icon="Bike" />
      <KpiTile label="Low-stock DCs" :value="kpis.lowStock" hint="≤ 10 available on a model" tone="warning" :icon="PackageX" />
      <KpiTile label="Retail value" :value="formatMoney(kpis.value)" hint="On-hand at MSRP" tone="success" :icon="DollarSign" />
    </KpiGrid>
    <KpiGrid v-else>
      <Skeleton v-for="i in 4" :key="i" variant="rounded" class="h-[150px] w-full" />
    </KpiGrid>

    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base">Stock position</CardTitle>
        <CardDescription>On-hand units · warehouses hold bulk, DCs hold buffers (low DC counts flagged)</CardDescription>
      </CardHeader>
      <CardContent>
        <OverlayScroll v-if="ready" class="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="sticky left-0">Location</TableHead>
                <TableHead v-for="m in CATALOG" :key="m.sku" class="text-right">{{ shortName(m.name) }}</TableHead>
                <TableHead class="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="loc in rows" :key="loc.id" class="hover:bg-muted/50">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Badge :variant="loc.type === 'warehouse' ? 'secondary' : 'outline'" class="text-[10px] uppercase">
                      {{ loc.type === 'warehouse' ? 'WH' : 'DC' }}
                    </Badge>
                    <span class="font-medium">{{ loc.name }}</span>
                  </div>
                </TableCell>
                <TableCell
                  v-for="sku in STOCK_SKUS"
                  :key="sku"
                  class="text-right tabular-nums"
                  :class="cellTone(loc, onHandAt(loc.id, sku))"
                >
                  {{ onHandAt(loc.id, sku) }}
                </TableCell>
                <TableCell class="text-right font-semibold tabular-nums">{{ locationOnHand(loc.id).toLocaleString() }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </OverlayScroll>
        <div v-else class="space-y-2">
          <Skeleton v-for="i in 8" :key="i" class="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
