<script setup lang="ts">
/**
 * Customers — Zepp D2C buyers. Data-table over the consumer list with
 * order/delivery stats derived live from the last-mile movement ledger.
 * Dispatcher-gated.
 */
import { h, computed } from 'vue'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { Users, Bike, PackageCheck, DollarSign, SearchX, MapPin, Store } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { DataTable, DataTableColumnHeader, type FilterDefinition } from '@/components/ui/data-table'
import KpiTile from '@/components/KpiTile.vue'
import { shortDate } from '@/lib/utils'

import { CONSUMERS, consumerStats, type Consumer } from '~/mocks/consumers'
import { CATALOG, modelName } from '~/mocks/catalog'
import { locationName } from '~/mocks/network'
import { formatMoney } from '~/mocks/movements'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Customers · Zepp' })

const totals = computed(() => ({
  count: CONSUMERS.length,
  active: CONSUMERS.reduce((a, c) => a + consumerStats(c.id).active, 0),
  delivered: CONSUMERS.reduce((a, c) => a + consumerStats(c.id).delivered, 0),
  revenue: CONSUMERS.reduce((a, c) => a + consumerStats(c.id).spendUsd, 0),
}))

function colHeader(column: Column<Consumer, unknown>, label: string) {
  return h(DataTableColumnHeader as never, { column, label })
}

const columns = computed<ColumnDef<Consumer>[]>(() => [
  {
    accessorKey: 'name',
    header: ({ column }) => colHeader(column, 'Customer'),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(Avatar, { class: 'size-8' }, () => h(AvatarFallback, { class: 'text-xs font-semibold' }, () => row.original.initials)),
        h('div', { class: 'flex flex-col leading-tight min-w-0' }, [
          h('span', { class: 'font-medium truncate' }, row.original.name),
          h('span', { class: 'text-muted-foreground text-xs truncate' }, row.original.email),
        ]),
      ]),
  },
  {
    accessorKey: 'orderedSku',
    header: ({ column }) => colHeader(column, 'Bike'),
    cell: ({ row }) => h(Badge, { variant: 'secondary', class: 'text-xs' }, () => modelName(row.original.orderedSku)),
  },
  {
    accessorKey: 'city',
    header: ({ column }) => colHeader(column, 'Location'),
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground inline-flex items-center gap-1 text-sm' }, [h(MapPin, { class: 'size-3' }), row.original.city]),
  },
  {
    accessorKey: 'assignedDcId',
    header: 'Fulfilled by',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground inline-flex items-center gap-1 text-sm' }, [h(Store, { class: 'size-3' }), locationName(row.original.assignedDcId)]),
  },
  {
    id: 'orders',
    header: 'Orders',
    cell: ({ row }) => {
      const st = consumerStats(row.original.id)
      return h('span', { class: 'text-sm tabular-nums' }, [
        h('span', { class: 'font-medium' }, String(st.active)),
        h('span', { class: 'text-muted-foreground' }, ` active · ${st.orders} total`),
      ])
    },
  },
  {
    accessorKey: 'since',
    header: ({ column }) => colHeader(column, 'Since'),
    cell: ({ row }) => h('span', { class: 'text-muted-foreground text-xs tabular-nums' }, shortDate(row.original.since)),
  },
])

const filters: FilterDefinition[] = [
  { column: 'orderedSku', label: 'Bike', type: 'multiselect', options: CATALOG.map((m) => ({ value: m.sku, label: m.name })) },
]
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-xl font-semibold tracking-tight">Customers</h1>
      <p class="text-muted-foreground text-xs">{{ CONSUMERS.length }} riders who bought a Zepp ebike.</p>
    </header>

    <KpiGrid>
      <KpiTile label="Customers" :value="totals.count" hint="D2C riders" tone="info" :icon="Users" />
      <KpiTile label="Active deliveries" :value="totals.active" hint="In the network" tone="info" :icon="Bike" />
      <KpiTile label="Delivered" :value="totals.delivered" hint="All time" tone="success" :icon="PackageCheck" />
      <KpiTile label="Delivery spend" :value="formatMoney(totals.revenue)" hint="Last-mile cost" tone="warning" :icon="DollarSign" />
    </KpiGrid>

    <DataTable
      :columns="columns"
      :data="CONSUMERS"
      filter-column="name"
      filter-placeholder="Search customers…"
      :filters="filters"
      filter-mode="modal"
      sticky-header
      max-height="600px"
      density="cozy"
    >
      <template #empty>
        <EmptyState :icon="SearchX" title="No customers match" description="Try clearing filters." class="py-10" />
      </template>
    </DataTable>
  </div>
</template>
