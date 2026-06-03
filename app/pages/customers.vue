<script setup lang="ts">
/**
 * Customer accounts. Data-table over the customer list with shipment
 * stats derived live from the ledger. Dispatcher-gated.
 */
import { h, computed } from 'vue'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { Building2, Crown, Package, Gauge, SearchX, MapPin } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { DataTable, DataTableColumnHeader, type FilterDefinition } from '@/components/ui/data-table'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge, shortDate } from '@/lib/utils'

import {
  CUSTOMERS, TIER_LABELS, TIER_TONE, customerStats, type Customer,
} from '~/mocks/customers'
import { formatMoney } from '~/mocks/shipments'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Customers · ShipTrack' })

const totals = computed(() => ({
  count: CUSTOMERS.length,
  enterprise: CUSTOMERS.filter((c) => c.tier === 'enterprise').length,
  active: CUSTOMERS.reduce((a, c) => a + customerStats(c.id).active, 0),
  avgOnTime: Math.round(CUSTOMERS.reduce((a, c) => a + c.onTimeRate, 0) / CUSTOMERS.length),
}))

function colHeader(column: Column<Customer, unknown>, label: string) {
  return h(DataTableColumnHeader as never, { column, label })
}

const columns = computed<ColumnDef<Customer>[]>(() => [
  {
    accessorKey: 'name',
    header: ({ column }) => colHeader(column, 'Account'),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(Avatar, { class: 'size-8' }, () => h(AvatarFallback, { class: 'text-xs font-semibold' }, () => row.original.initials)),
        h('div', { class: 'flex flex-col leading-tight min-w-0' }, [
          h('span', { class: 'font-medium truncate' }, row.original.name),
          h('span', { class: 'text-muted-foreground text-xs truncate' }, row.original.contact),
        ]),
      ]),
  },
  {
    accessorKey: 'tier',
    header: ({ column }) => colHeader(column, 'Tier'),
    cell: ({ row }) => h(Badge, { variant: toneBadge(TIER_TONE[row.original.tier]), class: 'text-xs' }, () => TIER_LABELS[row.original.tier]),
  },
  {
    accessorKey: 'city',
    header: ({ column }) => colHeader(column, 'Location'),
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground inline-flex items-center gap-1 text-sm' }, [h(MapPin, { class: 'size-3' }), row.original.city]),
  },
  {
    id: 'shipments',
    header: 'Shipments',
    cell: ({ row }) => {
      const st = customerStats(row.original.id)
      return h('span', { class: 'text-sm tabular-nums' }, [
        h('span', { class: 'font-medium' }, String(st.active)),
        h('span', { class: 'text-muted-foreground' }, ` active · ${st.total} total`),
      ])
    },
  },
  {
    accessorKey: 'onTimeRate',
    header: ({ column }) => colHeader(column, 'On-time'),
    cell: ({ row }) =>
      h('span', { class: `text-sm font-medium tabular-nums ${row.original.onTimeRate >= 95 ? 'text-success' : row.original.onTimeRate < 90 ? 'text-warning' : ''}` }, `${row.original.onTimeRate}%`),
  },
  {
    id: 'revenue',
    header: 'Spend',
    cell: ({ row }) => h('span', { class: 'text-sm tabular-nums' }, formatMoney(customerStats(row.original.id).revenue)),
  },
  {
    accessorKey: 'since',
    header: ({ column }) => colHeader(column, 'Since'),
    cell: ({ row }) => h('span', { class: 'text-muted-foreground text-xs tabular-nums' }, shortDate(row.original.since)),
  },
])

const filters: FilterDefinition[] = [
  { column: 'tier', label: 'Tier', type: 'multiselect', options: (['enterprise', 'business', 'standard'] as const).map((t) => ({ value: t, label: TIER_LABELS[t] })) },
]
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-xl font-semibold tracking-tight">Customers</h1>
      <p class="text-muted-foreground text-xs">{{ CUSTOMERS.length }} accounts shipping with ShipTrack.</p>
    </header>

    <KpiGrid>
      <KpiTile label="Accounts" :value="totals.count" hint="Active customers" tone="info" :icon="Building2" />
      <KpiTile label="Enterprise" :value="totals.enterprise" hint="Top tier" tone="success" :icon="Crown" />
      <KpiTile label="Active shipments" :value="totals.active" hint="In the network" tone="info" :icon="Package" />
      <KpiTile label="Avg on-time" :value="`${totals.avgOnTime}%`" hint="Across accounts" tone="success" :icon="Gauge" />
    </KpiGrid>

    <DataTable
      :columns="columns"
      :data="CUSTOMERS"
      filter-column="name"
      filter-placeholder="Search accounts…"
      :filters="filters"
      filter-mode="modal"
      sticky-header
      max-height="600px"
      density="cozy"
    >
      <template #empty>
        <EmptyState :icon="SearchX" title="No accounts match" description="Try clearing filters." class="py-10" />
      </template>
    </DataTable>
  </div>
</template>
