<script setup lang="ts">
/**
 * Shipment detail. Hero with live status + route progress, KPI strip, and
 * tabs for the tracking timeline, package manifest, and documents. The
 * tracking timeline + manifest are derived from the shipment via
 * `getShipmentDetail` (see app/mocks/shipment-detail.ts).
 */
import { computed } from 'vue'
import {
  ArrowLeft, ArrowRight, MapPin, Truck, Clock, Weight, DollarSign, Boxes,
  FileText, Download, Copy, User, Building2, Package,
} from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Timeline, TimelineItem, TimelineMedia, TimelineContent, TimelineTitle, TimelineDate, TimelineDescription,
} from '@/components/ui/timeline'
import KpiTile from '@/components/KpiTile.vue'
import JourneyMap from '@/components/JourneyMap.vue'
import JourneyMapMapbox from '@/components/JourneyMapMapbox.vue'
import { toast } from 'vue-sonner'
import { toneBadge, toneDot, shortDate } from '@/lib/utils'

import {
  findShipment, STATUS_LABELS, STATUS_TONE, SERVICE_LABELS, PRIORITY_LABELS,
  PRIORITY_TONE, formatMoney, formatWeight,
} from '~/mocks/shipments'
import { getShipmentDetail, type EventState } from '~/mocks/shipment-detail'
import { findConsumer } from '~/mocks/consumers'
import { liveGeometry } from '~/mocks/live'

const route = useRoute()
const { isDispatcher } = usePersona()
const id = computed(() => String(route.params.id))

const shipment = computed(() => findShipment(id.value))
const detail = computed(() => (shipment.value ? getShipmentDetail(shipment.value.id) : undefined))
// Real road geometry for the geographic journey map (null → fall back to the arc).
const liveGeo = computed(() => (shipment.value ? liveGeometry(shipment.value.id) : null))
// For last-mile the recipient is a real consumer (real name / address / city);
// fall back to the destId-based lookup for any other leg.
const consumer = computed(() =>
  shipment.value ? findConsumer(shipment.value.consumerId ?? shipment.value.customerId) : undefined,
)

useHead(() => ({ title: shipment.value ? `${shipment.value.id} · Zepp` : `Shipment · Zepp` }))

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()} · ${hh}:${mm} UTC`
}

// Not-yet-reached steps carry a *planned* ETA, not a real scan — render the
// date (no clock time) as a "Scheduled" estimate so it doesn't read as
// fabricated history. The ETA is a full ISO datetime, so format date-only here
// rather than via shortDate (which only parses yyyy-mm-dd).
function fmtPlannedDate(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}
function fmtStamp(iso: string, planned?: boolean): string {
  return planned ? `Scheduled · ${fmtPlannedDate(iso)}` : fmtDateTime(iso)
}

function copyTracking() {
  if (!shipment.value || !import.meta.client) return
  navigator.clipboard?.writeText(shipment.value.trackingNumber).then(() => toast.success('Tracking number copied'))
}

// Event lifecycle state → Timeline status (marker + connector colour).
const esStatus = (s: EventState): 'success' | 'default' | 'muted' =>
  s === 'done' ? 'success' : s === 'current' ? 'default' : 'muted'
</script>

<template>
  <div v-if="!shipment" class="p-6">
    <Card>
      <CardContent class="space-y-3 p-8 text-center">
        <p class="text-foreground text-lg font-semibold">Shipment not found</p>
        <p class="text-muted-foreground text-sm">No shipment matching “{{ id }}” in this mock dataset.</p>
        <Button variant="outline" as-child class="mt-2">
          <NuxtLink to="/shipments"><ArrowLeft class="mr-2 size-4" />Back to shipments</NuxtLink>
        </Button>
      </CardContent>
    </Card>
  </div>

  <div v-else class="space-y-5 p-4 md:p-6">
    <Button variant="ghost" size="sm" class="text-muted-foreground -ml-2" as-child>
      <NuxtLink to="/shipments"><ArrowLeft class="mr-2 size-4" />Back to shipments</NuxtLink>
    </Button>

    <!-- Hero -->
    <Card>
      <CardContent class="p-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-semibold tracking-tight">{{ shipment.id }}</h1>
              <Badge :variant="toneBadge(STATUS_TONE[shipment.status])">
                <span :class="`size-1.5 rounded-full ${toneDot(STATUS_TONE[shipment.status])}`" aria-hidden="true" />
                {{ STATUS_LABELS[shipment.status] }}
              </Badge>
              <Badge :variant="toneBadge(PRIORITY_TONE[shipment.priority])" class="text-xs">{{ PRIORITY_LABELS[shipment.priority] }}</Badge>
            </div>
            <button class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-sm" @click="copyTracking">
              {{ shipment.trackingNumber }}<Copy class="size-3.5" />
            </button>
            <div class="flex items-center gap-2 text-sm">
              <span class="font-semibold">{{ shipment.origin }}</span>
              <ArrowRight class="text-muted-foreground size-4" />
              <span class="font-semibold">{{ shipment.destination }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="toast.info('Customer notified (mock)')">Notify customer</Button>
            <Button v-if="isDispatcher" size="sm" @click="toast.success('Status updated (mock)')">Update status</Button>
          </div>
        </div>

        <p class="text-muted-foreground mt-4 text-xs">
          Last scan <span class="text-foreground font-medium">{{ shipment.lastLocation }}</span> ·
          ETA <span class="text-foreground font-medium">{{ shortDate(shipment.estimatedDelivery) }}</span>
          <template v-if="shipment.actualDelivery"> · delivered {{ shortDate(shipment.actualDelivery) }}</template>
        </p>
      </CardContent>
    </Card>

    <!-- Live journey -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base">Live journey</CardTitle>
        <CardDescription>{{ liveGeo ? 'Live position on the delivery route' : 'Hover a stop for its scan time' }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3 pt-1">
        <!-- Real road map when the movement has baked geometry; the stylised arc otherwise. -->
        <div v-if="liveGeo" class="relative h-[280px] w-full overflow-hidden rounded-xl border">
          <ClientOnly>
            <JourneyMapMapbox
              :coords="liveGeo.coords"
              :stops="liveGeo.stops"
              :progress="shipment.progress"
              :origin-label="shipment.origin"
              :destination-label="shipment.destination"
              :delivered="shipment.status === 'delivered'"
            />
            <template #fallback><Skeleton class="size-full rounded-none" /></template>
          </ClientOnly>
        </div>
        <JourneyMap
          v-else-if="detail"
          :stops="detail.stops"
          :progress="shipment.progress"
          :origin-label="shipment.origin"
          :destination-label="shipment.destination"
          :status-label="STATUS_LABELS[shipment.status]"
          :delivered="shipment.status === 'delivered'"
        />
        <div>
          <div class="text-muted-foreground mb-1 flex items-center justify-between text-xs">
            <span>Route progress</span>
            <span class="tabular-nums">{{ shipment.progress }}%</span>
          </div>
          <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              :class="['h-full rounded-full transition-[width] duration-500', shipment.status === 'delivered' ? 'bg-success' : 'bg-primary']"
              :style="{ width: `${shipment.progress}%` }"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- KPI strip -->
    <KpiGrid>
      <KpiTile label="Progress" :value="`${shipment.progress}%`" :hint="STATUS_LABELS[shipment.status]" tone="info" :icon="Truck" />
      <KpiTile label="ETA" :value="shortDate(shipment.estimatedDelivery)" hint="Estimated arrival" tone="success" :icon="Clock" />
      <KpiTile label="Weight" :value="formatWeight(shipment.weightKg)" :hint="`${shipment.pieces} ${shipment.pieces === 1 ? 'piece' : 'pieces'}`" tone="info" :icon="Weight" />
      <KpiTile v-if="isDispatcher" label="Declared value" :value="formatMoney(shipment.valueUsd)" :hint="`Cost ${formatMoney(shipment.costUsd)}`" tone="warning" :icon="DollarSign" />
      <KpiTile v-else label="Service" :value="SERVICE_LABELS[shipment.service]" :hint="shipment.carrier" tone="info" :icon="Package" />
    </KpiGrid>

    <div class="grid gap-3 lg:grid-cols-12">
      <!-- Tabs: tracking / packages / documents -->
      <Card class="lg:col-span-8">
        <CardContent class="p-4">
          <Tabs default-value="tracking">
            <TabsList class="mb-4">
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <!-- Tracking timeline -->
            <TabsContent value="tracking">
              <Timeline density="default">
                <TimelineItem v-for="e in detail?.events" :key="e.id" :status="esStatus(e.state)">
                  <TimelineMedia variant="dot" colored-connector />
                  <TimelineContent>
                    <div class="flex flex-wrap items-center justify-between gap-x-3">
                      <TimelineTitle :class="e.state === 'pending' ? 'text-muted-foreground' : ''">{{ e.label }}</TimelineTitle>
                      <TimelineDate class="tabular-nums">{{ fmtStamp(e.time, e.planned) }}</TimelineDate>
                    </div>
                    <TimelineDescription class="flex items-center gap-1 text-xs"><MapPin class="size-3 shrink-0" />{{ e.location }}</TimelineDescription>
                    <p v-if="e.note" class="text-foreground/80 text-xs">{{ e.note }}</p>
                  </TimelineContent>
                </TimelineItem>
              </Timeline>
            </TabsContent>

            <!-- Packages -->
            <TabsContent value="packages">
              <div class="space-y-2">
                <div v-for="p in detail?.packages" :key="p.id" class="flex items-center gap-3 rounded-lg border p-3">
                  <span class="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Boxes class="text-muted-foreground size-4" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">{{ p.description }}</p>
                    <p class="text-muted-foreground text-xs font-mono">{{ p.id }}</p>
                  </div>
                  <div class="text-right text-xs">
                    <p class="font-medium tabular-nums">{{ formatWeight(p.weightKg) }}</p>
                    <p class="text-muted-foreground">{{ p.dims }}</p>
                  </div>
                </div>
                <p class="text-muted-foreground pt-1 text-xs">
                  Total {{ shipment.pieces }} {{ shipment.pieces === 1 ? 'piece' : 'pieces' }} · {{ formatWeight(shipment.weightKg) }} · {{ shipment.contents }}
                </p>
              </div>
            </TabsContent>

            <!-- Documents -->
            <TabsContent value="documents">
              <div class="space-y-2">
                <div v-for="d in detail?.documents" :key="d.id" class="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors">
                  <span class="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileText class="text-muted-foreground size-4" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">{{ d.name }}</p>
                    <p class="text-muted-foreground text-xs">{{ d.kind }} · {{ shortDate(d.date) }}</p>
                  </div>
                  <Button variant="ghost" size="icon" class="size-8" aria-label="Download" @click="toast.success(`Downloading ${d.name} (mock)`)">
                    <Download class="size-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <!-- Side rail: details + route stops -->
      <div class="lg:col-span-4 space-y-3">
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-base">Details</CardTitle></CardHeader>
          <CardContent class="space-y-2.5 text-sm">
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground flex items-center gap-1.5"><Building2 class="size-3.5" />{{ shipment.leg === 'last-mile' ? 'Recipient' : 'Customer' }}</span>
              <NuxtLink v-if="consumer" :to="`/customers`" class="font-medium hover:underline">{{ shipment.customer }}</NuxtLink>
              <span v-else class="font-medium">{{ shipment.customer }}</span>
            </div>
            <div v-if="shipment.leg === 'last-mile' && consumer" class="text-muted-foreground flex items-center gap-1.5 text-xs">
              <MapPin class="size-3.5 shrink-0" />{{ consumer.address }} · {{ consumer.city }}
            </div>
            <Separator />
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground flex items-center gap-1.5"><Truck class="size-3.5" />Carrier</span>
              <span class="font-medium">{{ shipment.carrier }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Service</span>
              <Badge variant="outline" class="text-xs font-normal">{{ SERVICE_LABELS[shipment.service] }}</Badge>
            </div>
            <div v-if="shipment.driver" class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground flex items-center gap-1.5"><User class="size-3.5" />Driver</span>
              <span class="font-medium">{{ shipment.driver }}</span>
            </div>
            <div v-if="shipment.vehicle" class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Vehicle</span>
              <span class="font-mono text-xs">{{ shipment.vehicle }}</span>
            </div>
            <Separator />
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Booked</span>
              <span class="tabular-nums">{{ shortDate(shipment.createdDate) }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Shipped</span>
              <span class="tabular-nums">{{ shortDate(shipment.shipDate) }}</span>
            </div>
            <div v-if="detail?.signedBy" class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Signed by</span>
              <span class="font-medium">{{ detail.signedBy }}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base">Route stops</CardTitle>
            <CardDescription>{{ shipment.route ?? (shipment.leg === 'last-mile' ? `${shipment.origin} → ${consumer?.name ?? shipment.destination}` : 'Direct lane') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline density="compact">
              <TimelineItem v-for="(st, i) in detail?.stops" :key="i" :status="esStatus(st.state)">
                <TimelineMedia variant="dot" colored-connector />
                <TimelineContent>
                  <TimelineTitle :class="st.state === 'pending' ? 'text-muted-foreground font-normal' : ''">{{ st.name }}</TimelineTitle>
                  <TimelineDate class="tabular-nums">{{ fmtStamp(st.eta, st.planned) }}</TimelineDate>
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
