<script setup lang="ts">
/**
 * Public-style "track a package" lookup. Enter a tracking number (or
 * shipment id) and see the live status + event timeline. Pre-fills from a
 * `?ref=` query so deep-links from the ledger land here ready to go.
 */
import { ref, computed, watch } from 'vue'
import {
  Search, MapPin, ArrowRight, PackageSearch,
} from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Timeline, TimelineItem, TimelineMedia, TimelineContent, TimelineTitle, TimelineDate, TimelineDescription,
} from '@/components/ui/timeline'
import JourneyMap from '@/components/JourneyMap.vue'
import JourneyMapMapbox from '@/components/JourneyMapMapbox.vue'
import { toneBadge, toneDot, shortDate } from '@/lib/utils'

import { findShipment, STATUS_LABELS, STATUS_TONE, lastMile } from '~/mocks/shipments'
import { getShipmentDetail, type EventState } from '~/mocks/shipment-detail'
import { liveGeometry } from '~/mocks/live'

useHead({ title: 'Track my bike · Zepp' })

const route = useRoute()
const query = ref(String(route.query.ref ?? ''))
const submitted = ref(Boolean(route.query.ref))

const shipment = computed(() => (submitted.value && query.value ? findShipment(query.value.trim()) : undefined))
const detail = computed(() => (shipment.value ? getShipmentDetail(shipment.value.id) : undefined))
const liveGeo = computed(() => (shipment.value ? liveGeometry(shipment.value.id) : null))

function track() {
  submitted.value = true
}

// A few real consumer tracking numbers users can click to try the demo —
// last-mile (DC → home) deliveries, the kind a bike buyer would actually look up.
const samples = computed(() => lastMile().slice(0, 4).map((s) => s.trackingNumber))
function useSample(ref_: string) {
  query.value = ref_
  submitted.value = true
}

watch(() => route.query.ref, (v) => {
  if (typeof v === 'string') {
    query.value = v
    submitted.value = true
  }
})

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()} · ${hh}:${mm}`
}

const esStatus = (s: EventState): 'success' | 'default' | 'muted' =>
  s === 'done' ? 'success' : s === 'current' ? 'default' : 'muted'
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4 p-3 md:p-6">
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">Track my bike</h1>
      <p class="text-muted-foreground text-sm">Enter a tracking number or order ID to see live delivery status.</p>
    </div>

    <Card>
      <CardContent class="p-4">
        <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="track">
          <div class="relative flex-1">
            <Search class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input v-model="query" aria-label="Tracking number or order ID" placeholder="e.g. ZP-2026-4F8A21 or MOV-L4101" class="pl-9" />
          </div>
          <Button type="submit"><Search class="mr-2 size-4" />Track</Button>
        </form>
        <div class="mt-3 flex flex-wrap items-center gap-1.5">
          <span class="text-muted-foreground text-xs">Try:</span>
          <button
            v-for="s in samples"
            :key="s"
            class="bg-muted hover:bg-muted/70 rounded-full px-2 py-0.5 font-mono text-xs transition-colors"
            @click="useSample(s)"
          >{{ s }}</button>
        </div>
      </CardContent>
    </Card>

    <!-- Result -->
    <template v-if="submitted">
      <Card v-if="shipment">
        <CardContent class="space-y-5 p-5">
          <!-- Status header -->
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="text-muted-foreground font-mono text-xs">{{ shipment.trackingNumber }}</p>
              <div class="flex items-center gap-2">
                <Badge :variant="toneBadge(STATUS_TONE[shipment.status])">
                  <span :class="`size-1.5 rounded-full ${toneDot(STATUS_TONE[shipment.status])}`" aria-hidden="true" />
                  {{ STATUS_LABELS[shipment.status] }}
                </Badge>
                <span class="text-muted-foreground text-sm">{{ shipment.contents }}</span>
              </div>
              <div class="flex items-center gap-2 pt-1 text-sm">
                <span class="font-semibold">{{ shipment.origin }}</span>
                <ArrowRight class="text-muted-foreground size-4" />
                <span class="font-semibold">{{ shipment.destination }}</span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-muted-foreground text-xs">Estimated delivery</p>
              <p class="text-lg font-semibold tabular-nums">{{ shortDate(shipment.estimatedDelivery) }}</p>
            </div>
          </div>

          <!-- Live journey — real road map when geometry exists, stylised arc otherwise -->
          <div v-if="liveGeo" class="relative h-[260px] w-full overflow-hidden rounded-xl border">
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

          <!-- Timeline -->
          <div>
            <p class="mb-3 text-sm font-semibold">Tracking history</p>
            <Timeline density="default">
              <TimelineItem v-for="e in detail?.events" :key="e.id" :status="esStatus(e.state)">
                <TimelineMedia variant="dot" colored-connector />
                <TimelineContent>
                  <div class="flex flex-wrap items-center justify-between gap-x-3">
                    <TimelineTitle :class="e.state === 'pending' ? 'text-muted-foreground' : ''">{{ e.label }}</TimelineTitle>
                    <TimelineDate class="tabular-nums">{{ e.planned ? `Est. ${fmtDateTime(e.time)}` : fmtDateTime(e.time) }}</TimelineDate>
                  </div>
                  <TimelineDescription class="flex items-center gap-1 text-xs"><MapPin class="size-3 shrink-0" />{{ e.location }}</TimelineDescription>
                  <p v-if="e.note" class="text-foreground/80 text-xs">{{ e.note }}</p>
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          </div>
        </CardContent>
      </Card>

      <Card v-else>
        <CardContent class="p-8">
          <EmptyState
            :icon="PackageSearch"
            title="No package found"
            :description="`We couldn't find a shipment for “${query}”. Check the number and try again.`"
          />
        </CardContent>
      </Card>
    </template>
  </div>
</template>
