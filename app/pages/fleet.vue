<script setup lang="ts">
/**
 * Fleet — vehicle roster with utilization + status. Dispatcher-gated.
 */
import { h, computed } from 'vue'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { Truck, Wrench, CircleParking, Fuel, MapPin, Gauge, SearchX } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { DataTable, DataTableColumnHeader, type FilterDefinition } from '@/components/ui/data-table'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge, toneDot } from '@/lib/utils'

import {
  VEHICLES, VEHICLE_TYPES, VEHICLE_STATUSES, VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS,
  VEHICLE_STATUS_TONE, type Vehicle,
} from '~/mocks/fleet'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'Fleet · Zepp' })

const totals = computed(() => {
  const onRoute = VEHICLES.filter((v) => v.status === 'active').length
  const idle = VEHICLES.filter((v) => v.status === 'idle' || v.status === 'loading').length
  const maint = VEHICLES.filter((v) => v.status === 'maintenance').length
  const active = VEHICLES.filter((v) => v.loadKg > 0)
  const util = active.length
    ? Math.round(active.reduce((a, v) => a + (v.loadKg / v.capacityKg) * 100, 0) / active.length)
    : 0
  return { total: VEHICLES.length, onRoute, idle, maint, util }
})

function colHeader(column: Column<Vehicle, unknown>, label: string) {
  return h(DataTableColumnHeader as never, { column, label })
}

const columns = computed<ColumnDef<Vehicle>[]>(() => [
  {
    accessorKey: 'id',
    header: ({ column }) => colHeader(column, 'Vehicle'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col leading-tight' }, [
        h('span', { class: 'font-medium' }, row.original.id),
        h('span', { class: 'text-muted-foreground text-xs font-mono' }, row.original.plate),
      ]),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => colHeader(column, 'Type'),
    cell: ({ row }) => h(Badge, { variant: 'outline', class: 'text-xs font-normal' }, () => VEHICLE_TYPE_LABELS[row.original.type]),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => colHeader(column, 'Status'),
    cell: ({ row }) => {
      const tone = VEHICLE_STATUS_TONE[row.original.status]
      return h(Badge, { variant: toneBadge(tone) }, () => [
        h('span', { class: `size-1.5 rounded-full ${toneDot(tone)}`, 'aria-hidden': 'true' }),
        VEHICLE_STATUS_LABELS[row.original.status],
      ])
    },
  },
  {
    accessorKey: 'driver',
    header: ({ column }) => colHeader(column, 'Driver'),
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.driver ?? '—'),
  },
  {
    id: 'utilization',
    header: 'Load',
    cell: ({ row }) => {
      const pct = Math.round((row.original.loadKg / row.original.capacityKg) * 100)
      return h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'bg-muted h-1.5 w-16 overflow-hidden rounded-full' }, [
          h('div', { class: `h-full rounded-full ${pct > 85 ? 'bg-warning' : 'bg-primary'}`, style: `width:${pct}%` }),
        ]),
        h('span', { class: 'text-muted-foreground text-xs tabular-nums' }, `${pct}%`),
      ])
    },
  },
  {
    accessorKey: 'location',
    header: ({ column }) => colHeader(column, 'Location'),
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground inline-flex items-center gap-1 text-sm' }, [
        h(MapPin, { class: 'size-3' }), row.original.location,
      ]),
  },
  {
    accessorKey: 'fuelPct',
    header: ({ column }) => colHeader(column, 'Fuel'),
    cell: ({ row }) =>
      h('span', {
        class: `inline-flex items-center gap-1 text-xs tabular-nums ${row.original.fuelPct < 30 ? 'text-warning font-medium' : 'text-muted-foreground'}`,
      }, [h(Fuel, { class: 'size-3' }), `${row.original.fuelPct}%`]),
  },
])

const filters: FilterDefinition[] = [
  { column: 'type', label: 'Type', type: 'multiselect', options: VEHICLE_TYPES.map((t) => ({ value: t, label: VEHICLE_TYPE_LABELS[t] })) },
  { column: 'status', label: 'Status', type: 'multiselect', options: VEHICLE_STATUSES.map((s) => ({ value: s, label: VEHICLE_STATUS_LABELS[s] })) },
]
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header>
      <h1 class="text-xl font-semibold tracking-tight">Fleet</h1>
      <p class="text-muted-foreground text-xs">{{ VEHICLES.length }} vehicles · {{ totals.onRoute }} on route now.</p>
    </header>

    <KpiGrid>
      <KpiTile label="Total vehicles" :value="totals.total" hint="In service" tone="info" :icon="Truck" />
      <KpiTile label="On route" :value="totals.onRoute" hint="Moving freight" tone="success" :icon="Gauge" />
      <KpiTile label="Idle / loading" :value="totals.idle" hint="At yard or DC" tone="info" :icon="CircleParking" />
      <KpiTile label="In maintenance" :value="totals.maint" hint="Out of service" tone="warning" :icon="Wrench" />
    </KpiGrid>

    <DataTable
      :columns="columns"
      :data="VEHICLES"
      filter-column="id"
      filter-placeholder="Search by vehicle / plate…"
      :filters="filters"
      filter-mode="modal"
      sticky-header
      max-height="600px"
      density="cozy"
    >
      <template #empty>
        <EmptyState :icon="SearchX" title="No vehicles match" description="Try clearing filters." class="py-10" />
      </template>
    </DataTable>
  </div>
</template>
