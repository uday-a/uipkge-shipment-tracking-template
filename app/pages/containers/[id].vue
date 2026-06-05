<script setup lang="ts">
/**
 * Inbound container tracking — the ocean journey of one container, shown live
 * on a geographic map (origin port → Pacific → US port → import warehouse with
 * the vessel at its current position) plus a milestone timeline, the bike
 * manifest, and vessel/booking details. Dispatcher-gated.
 */
import { computed } from 'vue'
import {
  ArrowLeft, Boxes, DollarSign, Anchor, MapPin, Ship, CheckCircle2, CircleDot, Circle, Calendar,
} from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { KpiGrid } from '@/components/ui/kpi-grid'
import KpiTile from '@/components/KpiTile.vue'
import ContainerMap from '@/components/ContainerMap.vue'
import { toneBadge, toneDot, shortDate } from '@/lib/utils'

import {
  findContainer, containerTracking, CONTAINER_STATUS_LABELS, CONTAINER_STATUS_TONE,
  type ContainerMilestone,
} from '~/mocks/containers'
import { modelName } from '~/mocks/catalog'
import { locationName } from '~/mocks/network'
import { formatMoney, formatWeight } from '~/mocks/movements'

definePageMeta({ middleware: 'require-dispatcher' })

const route = useRoute()
const container = computed(() => findContainer(String(route.params.id)))
useHead(() => ({ title: container.value ? `${container.value.id} · Zepp` : 'Container · Zepp' }))

const milestones = computed<ContainerMilestone[]>(() => (container.value ? containerTracking(container.value) : []))
const manifest = computed(() =>
  container.value
    ? Object.entries(container.value.manifest).map(([sku, qty]) => ({ sku, qty })).sort((a, b) => b.qty - a.qty)
    : [],
)

const stateIcon = (s: ContainerMilestone['state']) => (s === 'done' ? CheckCircle2 : s === 'current' ? CircleDot : Circle)
const stateClass = (s: ContainerMilestone['state']) =>
  s === 'done' ? 'text-success' : s === 'current' ? 'text-primary' : 'text-muted-foreground/40'
</script>

<template>
  <div class="space-y-4 p-4 md:p-6">
    <Button variant="ghost" size="sm" class="text-muted-foreground -ml-2" as-child>
      <NuxtLink to="/containers"><ArrowLeft class="mr-2 size-4" />Back to containers</NuxtLink>
    </Button>

    <template v-if="container">
      <!-- Header -->
      <header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-semibold tracking-tight">{{ container.id }}</h1>
            <Badge :variant="toneBadge(CONTAINER_STATUS_TONE[container.status])" class="gap-1.5">
              <span :class="['size-1.5 rounded-full', toneDot(CONTAINER_STATUS_TONE[container.status])]" aria-hidden="true" />
              {{ CONTAINER_STATUS_LABELS[container.status] }}
            </Badge>
          </div>
          <p class="text-muted-foreground text-xs">
            <span class="font-mono">{{ container.bookingRef }}</span> · {{ container.vessel }} ·
            <span class="text-foreground font-medium">{{ container.originPortCode }}</span> →
            <span class="text-foreground font-medium">{{ container.destPortCode }}</span>
          </p>
          <p class="text-muted-foreground text-xs">Last update · {{ container.lastLocation }}</p>
        </div>
      </header>

      <!-- Live ocean map -->
      <Card class="overflow-hidden">
        <div class="relative h-[300px] w-full md:h-[340px]">
          <ClientOnly>
            <ContainerMap :container="container" />
            <template #fallback><Skeleton class="size-full rounded-none" /></template>
          </ClientOnly>
        </div>
        <div class="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs">
          <div class="min-w-0">
            <p class="text-muted-foreground">Origin port</p>
            <p class="truncate font-semibold">{{ container.originPort }}</p>
          </div>
          <div class="bg-muted flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1">
            <span :class="['size-1.5 rounded-full', toneDot(CONTAINER_STATUS_TONE[container.status])]" aria-hidden="true" />
            <span class="font-medium">{{ CONTAINER_STATUS_LABELS[container.status] }}</span>
            <span class="text-muted-foreground tabular-nums">· {{ container.progress }}%</span>
          </div>
          <div class="min-w-0 text-right">
            <p class="text-muted-foreground">Destination hub</p>
            <p class="truncate font-semibold">{{ locationName(container.destWarehouseId) }}</p>
          </div>
        </div>
      </Card>

      <!-- KPI strip -->
      <KpiGrid>
        <KpiTile label="Bikes aboard" :value="container.totalBikes.toLocaleString()" :hint="`${manifest.length} models`" tone="info" :icon="Boxes" />
        <KpiTile label="Declared value" :value="formatMoney(container.valueUsd)" :hint="formatWeight(container.weightKg)" tone="warning" :icon="DollarSign" />
        <KpiTile
          :label="container.status === 'received' ? 'Received' : 'ETA port'"
          :value="shortDate(container.status === 'received' ? (container.receivedDate ?? container.etaPort) : container.etaPort)"
          :hint="container.status === 'received' ? 'Landed at hub' : 'Estimated arrival'"
          :tone="container.status === 'received' ? 'success' : 'info'"
          :icon="Calendar"
        />
        <KpiTile label="Vessel" :value="container.vessel" :hint="`${container.originPortCode} → ${container.destPortCode}`" tone="info" :icon="Ship" />
      </KpiGrid>

      <div class="grid gap-3 lg:grid-cols-12">
        <!-- Milestone timeline -->
        <Card class="lg:col-span-8">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">Tracking</CardTitle>
            <CardDescription>Ocean milestones · factory to import warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            <ol class="relative space-y-0">
              <li v-for="(m, i) in milestones" :key="m.id" class="flex gap-3 pb-5 last:pb-0">
                <div class="flex flex-col items-center">
                  <component :is="stateIcon(m.state)" :class="['size-5 shrink-0', stateClass(m.state)]" />
                  <span
                    v-if="i < milestones.length - 1"
                    :class="['mt-1 w-px flex-1', m.state === 'done' ? 'bg-success/40' : 'bg-border']"
                  />
                </div>
                <div class="-mt-0.5 min-w-0 flex-1 pb-1">
                  <div class="flex flex-wrap items-center justify-between gap-x-3">
                    <p :class="['text-sm font-medium', m.state === 'pending' ? 'text-muted-foreground' : '']">{{ m.label }}</p>
                    <p class="text-muted-foreground text-xs tabular-nums">
                      {{ m.planned ? `Scheduled · ${shortDate(m.date)}` : shortDate(m.date) }}
                    </p>
                  </div>
                  <p class="text-muted-foreground flex items-center gap-1 text-xs"><MapPin class="size-3 shrink-0" />{{ m.location }}</p>
                  <p v-if="m.note" class="text-foreground/80 mt-0.5 text-xs">{{ m.note }}</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <!-- Manifest + details -->
        <div class="space-y-3 lg:col-span-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-base">Manifest</CardTitle>
              <CardDescription>{{ container.totalBikes.toLocaleString() }} bikes aboard</CardDescription>
            </CardHeader>
            <CardContent class="space-y-2">
              <div v-for="m in manifest" :key="m.sku" class="flex items-center justify-between text-sm">
                <span class="inline-flex items-center gap-1.5"><Boxes class="text-muted-foreground size-3.5" />{{ modelName(m.sku) }}</span>
                <span class="font-semibold tabular-nums">{{ m.qty }}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2"><CardTitle class="text-base">Vessel & booking</CardTitle></CardHeader>
            <CardContent class="space-y-2.5 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground inline-flex items-center gap-1.5"><Ship class="size-3.5" />Vessel</span>
                <span class="font-medium">{{ container.vessel }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground inline-flex items-center gap-1.5"><Anchor class="size-3.5" />Origin</span>
                <span class="font-medium">{{ container.originPort }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground inline-flex items-center gap-1.5"><Anchor class="size-3.5" />Discharge</span>
                <span class="font-medium">{{ container.destPort }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">Departed</span>
                <span class="font-medium tabular-nums">{{ shortDate(container.departedDate) }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">ETA port</span>
                <span class="font-medium tabular-nums">{{ shortDate(container.etaPort) }}</span>
              </div>
              <div v-if="container.receivedDate" class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">Received</span>
                <span class="text-success font-medium tabular-nums">{{ shortDate(container.receivedDate) }}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>

    <Card v-else>
      <CardContent class="p-8">
        <EmptyState :icon="Ship" title="Container not found" :description="`No inbound container matches “${route.params.id}”.`" />
      </CardContent>
    </Card>
  </div>
</template>
