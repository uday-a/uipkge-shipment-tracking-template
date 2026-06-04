<script setup lang="ts">
/**
 * Shipments ledger. Sortable, filterable data-table over the mock
 * shipment array with a summary KPI strip. Supports a `?status=` query
 * param (used by the topbar exceptions bell + dashboard deep-links) which
 * pre-filters the rows and shows a clearable banner.
 */
import { h, computed } from 'vue'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import {
  MoreHorizontal, Package, Truck, PackageCheck, TriangleAlert, MapPin,
  ArrowRight, SearchX, X, PackagePlus, Download,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { DataTable, DataTableColumnHeader, type FilterDefinition } from '@/components/ui/data-table'
import { toast } from 'vue-sonner'
import KpiTile from '@/components/KpiTile.vue'
import { toneBadge, toneDot, shortDate } from '@/lib/utils'

import {
  SHIPMENTS, STATUSES, STATUS_LABELS, STATUS_TONE, SERVICE_LEVELS, SERVICE_LABELS,
  CARRIERS, PRIORITIES, PRIORITY_LABELS, PRIORITY_TONE, formatMoney,
  isActive, isException, type Shipment,
} from '~/mocks/shipments'

useHead({ title: 'Movements · Zepp' })

const { isDispatcher } = usePersona()
const route = useRoute()
const router = useRouter()

const statusFilter = computed(() => (route.query.status as string) || '')
const rows = computed(() =>
  statusFilter.value ? SHIPMENTS.filter((s) => s.status === statusFilter.value) : SHIPMENTS,
)

function clearStatus() {
  router.replace({ query: {} })
}

const totals = computed(() => ({
  active: SHIPMENTS.filter(isActive).length,
  inTransit: SHIPMENTS.filter((s) => ['in-transit', 'out-for-delivery', 'picked-up'].includes(s.status)).length,
  delivered: SHIPMENTS.filter((s) => s.status === 'delivered').length,
  exceptions: SHIPMENTS.filter(isException).length,
}))

function colHeader(column: Column<Shipment, unknown>, label: string) {
  return h(DataTableColumnHeader as never, { column, label })
}

const columns = computed<ColumnDef<Shipment>[]>(() => {
  const base: ColumnDef<Shipment>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => colHeader(column, 'Shipment'),
      cell: ({ row }) => {
        const s = row.original
        return h('div', { class: 'flex flex-col leading-tight' }, [
          h('span', { class: 'font-medium' }, s.id),
          h('span', { class: 'text-muted-foreground text-xs font-mono' }, s.trackingNumber),
        ])
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => colHeader(column, 'Status'),
      cell: ({ row }) => {
        const tone = STATUS_TONE[row.original.status]
        return h(Badge, { variant: toneBadge(tone) }, () => [
          h('span', { class: `size-1.5 rounded-full ${toneDot(tone)}`, 'aria-hidden': 'true' }),
          STATUS_LABELS[row.original.status],
        ])
      },
    },
    {
      accessorKey: 'customer',
      header: ({ column }) => colHeader(column, 'Recipient'),
      cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.customer),
    },
    {
      id: 'lane',
      header: 'Lane',
      cell: ({ row }) => {
        const s = row.original
        return h('span', { class: 'text-muted-foreground inline-flex items-center gap-1 text-xs' }, [
          h('span', { class: 'text-foreground font-medium' }, s.originCode),
          h(ArrowRight, { class: 'size-3' }),
          h('span', { class: 'text-foreground font-medium' }, s.destinationCode),
        ])
      },
    },
    {
      accessorKey: 'service',
      header: ({ column }) => colHeader(column, 'Service'),
      cell: ({ row }) => h(Badge, { variant: 'outline', class: 'text-xs font-normal' }, () => SERVICE_LABELS[row.original.service]),
    },
    {
      accessorKey: 'carrier',
      header: ({ column }) => colHeader(column, 'Carrier'),
      cell: ({ row }) => h('span', { class: 'text-muted-foreground text-sm' }, row.original.carrier),
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => colHeader(column, 'Priority'),
      cell: ({ row }) => {
        const tone = PRIORITY_TONE[row.original.priority]
        return h(Badge, { variant: toneBadge(tone), class: 'text-xs' }, () => PRIORITY_LABELS[row.original.priority])
      },
    },
    {
      accessorKey: 'progress',
      header: ({ column }) => colHeader(column, 'Progress'),
      cell: ({ row }) =>
        h('div', { class: 'flex items-center gap-2' }, [
          h('div', { class: 'bg-muted h-1.5 w-16 overflow-hidden rounded-full' }, [
            h('div', { class: 'bg-primary h-full rounded-full', style: `width:${row.original.progress}%` }),
          ]),
          h('span', { class: 'text-muted-foreground text-xs tabular-nums' }, `${row.original.progress}%`),
        ]),
    },
    {
      accessorKey: 'estimatedDelivery',
      header: ({ column }) => colHeader(column, 'ETA'),
      cell: ({ row }) => h('span', { class: 'text-muted-foreground text-xs tabular-nums' }, shortDate(row.original.estimatedDelivery)),
    },
  ]

  if (isDispatcher.value) {
    base.push({
      accessorKey: 'valueUsd',
      header: ({ column }) => colHeader(column, 'Value'),
      cell: ({ row }) => h('span', { class: 'text-sm font-medium tabular-nums' }, formatMoney(row.original.valueUsd)),
    })
  }

  base.push({
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, {
              variant: 'ghost', size: 'icon', class: 'size-8',
              onClick: (e: Event) => e.stopPropagation(), ariaLabel: 'Row actions',
            }, () => h(MoreHorizontal, { class: 'size-4' })),
          ),
          h(DropdownMenuContent, { align: 'end', class: 'w-44' }, () => [
            h(DropdownMenuLabel, () => 'Actions'),
            h(DropdownMenuSeparator),
            h(DropdownMenuItem, { onClick: () => navigateTo(`/shipments/${row.original.id}`) }, () => 'Open details'),
            h(DropdownMenuItem, { onClick: () => navigateTo(`/tracking?ref=${row.original.trackingNumber}`) }, () => 'Track package'),
            h(DropdownMenuItem, { onClick: () => toast.info(`Notified ${row.original.customer} (mock)`) }, () => 'Notify customer'),
          ]),
        ],
      }),
  })

  return base
})

const filters: FilterDefinition[] = [
  { column: 'status', label: 'Status', type: 'multiselect', options: STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
  { column: 'service', label: 'Service', type: 'multiselect', options: SERVICE_LEVELS.map((s) => ({ value: s, label: SERVICE_LABELS[s] })) },
  { column: 'carrier', label: 'Carrier', type: 'multiselect', options: CARRIERS.map((c) => ({ value: c, label: c })) },
  { column: 'priority', label: 'Priority', type: 'multiselect', options: PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] })) },
  { column: 'estimatedDelivery', label: 'ETA', type: 'date' },
]

function handleRowClick(row: Shipment) {
  navigateTo(`/shipments/${row.id}`)
}
function onBulkExport(r: any[]) {
  toast.success(`Exporting ${r.length} shipments (mock)`)
}
function onBulkNotify(r: any[]) {
  toast.info(`Notifying ${r.length} customers (mock)`)
}
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Movements</h1>
        <p class="text-muted-foreground text-xs">
          {{ SHIPMENTS.length }} movements · WH→DC transfers + last-mile · {{ totals.active }} active.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="onBulkExport(SHIPMENTS)">
          <Download class="mr-2 size-4" />Export
        </Button>
        <Button v-if="isDispatcher" size="sm" as-child>
          <NuxtLink to="/shipments/new"><PackagePlus class="mr-2 size-4" />New order</NuxtLink>
        </Button>
      </div>
    </header>

    <KpiGrid>
      <KpiTile label="Active" :value="totals.active" hint="Still in the network" tone="info" :icon="Package" />
      <KpiTile label="In transit" :value="totals.inTransit" hint="On the move" tone="info" :icon="Truck" />
      <KpiTile label="Delivered" :value="totals.delivered" hint="Completed" tone="success" :icon="PackageCheck" />
      <KpiTile label="Exceptions" :value="totals.exceptions" hint="Delays + holds" tone="warning" :icon="TriangleAlert" />
    </KpiGrid>

    <div v-if="statusFilter" class="flex items-center gap-2">
      <Badge variant="secondary" class="gap-1">
        Filtered: {{ STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS] ?? statusFilter }}
        <button class="hover:text-foreground ml-0.5" aria-label="Clear filter" @click="clearStatus">
          <X class="size-3" />
        </button>
      </Badge>
      <span class="text-muted-foreground text-xs">{{ rows.length }} matching</span>
    </div>

    <DataTable
      :columns="columns"
      :data="rows"
      filter-column="id"
      filter-placeholder="Search by shipment / tracking #…"
      :filters="filters"
      filter-mode="modal"
      sticky-header
      max-height="640px"
      density="cozy"
      :on-row-click="handleRowClick"
    >
      <template #bulk-actions="{ rows: selected, clear }">
        <Button variant="outline" size="sm" @click="onBulkExport(selected); clear()">
          <Download class="mr-2 size-3.5" />Export
        </Button>
        <Button variant="outline" size="sm" @click="onBulkNotify(selected); clear()">
          <MapPin class="mr-2 size-3.5" />Notify
        </Button>
      </template>
      <template #empty>
        <EmptyState :icon="SearchX" title="No shipments match" description="Try clearing filters or widening the search." class="py-10" />
      </template>
    </DataTable>
  </div>
</template>
