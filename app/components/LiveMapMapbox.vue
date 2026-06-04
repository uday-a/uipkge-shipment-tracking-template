<script setup lang="ts">
/**
 * LiveMapMapbox — the live fleet map (orchestrator).
 *
 * Owns the single <MapboxMap> (the provide("mapbox-map") boundary); its slot
 * children — <FleetTruckMarker> and <TripItineraryMarkers> — inherit the
 * injected map. Markers are declarative Vue components (show/hide via v-show /
 * v-if, never element opacity, which Mapbox overwrites each render). All the
 * imperative map work (basemap repaint, route line layers, focus, fit/fly,
 * theme→restyle) lives in useFleetMap. The component is rendered client-only
 * (live.vue wraps it in <ClientOnly> with a placeholder fallback).
 */
import { computed, toRef } from 'vue'
import { MapboxMap } from '@studiometa/vue-mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useFleetMap, splitByProgress } from '~/composables/useFleetMap'
import type { ResolvedTrip } from '~/mocks/live'
import type { Tone } from '~/mocks/shipments'
import { NETWORK } from '~/mocks/network'

const props = defineProps<{ trips: ResolvedTrip[]; selectedId: string | null }>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const config = useRuntimeConfig()

// Markers are DOM in Vue templates, so they read CSS vars directly (no canvas).
const TONE_CSS: Record<Tone, string> = {
  success: 'var(--success)', info: 'var(--info)', warning: 'var(--warning)', destructive: 'var(--destructive)', muted: 'var(--muted-foreground)',
}

// Destructure so `mapStyle` is a top-level setup ref — the template unwraps it
// to a string (nested `fleet.mapStyle` would pass the ComputedRef object as the
// prop and break SSR payload serialization).
const { onMapCreated, hover, mapStyle } = useFleetMap({ trips: toRef(props, 'trips'), selectedId: toRef(props, 'selectedId') })
defineExpose({ hover })

/** Fixed network facilities — import warehouses + distribution centers. */
const networkPoints = computed(() =>
  NETWORK.map((l) => ({
    id: l.id,
    type: l.type,
    label: l.name,
    code: l.code,
    lngLat: [l.coords[1], l.coords[0]] as [number, number],
  })),
)

/** One marker per trip at its current position (same cut point as the route). */
const truckPoints = computed(() =>
  props.trips.map((t) => {
    const { truck } = splitByProgress(t.coords, t.shipment.progress)
    return { id: t.shipment.id, lngLat: [truck[1], truck[0]] as [number, number], tone: t.tone, progress: t.shipment.progress }
  }),
)

/** Origin / stops / destination of the selected trip, with labels. */
const itinerary = computed(() => {
  const t = props.trips.find((tr) => tr.shipment.id === props.selectedId) ?? null
  if (!t) return null
  const o = t.coords[0]!, d = t.coords[t.coords.length - 1]!
  const via = (t.shipment.lastLocation || '').split('—')[0]!.trim()
  return {
    tone: t.tone,
    origin: { lngLat: [o[1], o[0]] as [number, number], label: t.shipment.origin },
    dest: { lngLat: [d[1], d[0]] as [number, number], label: t.shipment.destination },
    stops: (t.stops ?? []).map((s, i) => ({ lngLat: [s[1], s[0]] as [number, number], label: via || `Stop ${i + 1}` })),
  }
})
</script>

<template>
  <MapboxMap
    class="bg-muted size-full"
    :access-token="(config.public.mapboxToken as string)"
    :map-style="mapStyle"
    :center="[-98.35, 39.5]"
    :zoom="3.6"
    :attribution-control="false"
    @mb-created="onMapCreated"
  >
    <!-- Network — fixed import warehouses (labelled hubs) + distribution centers. -->
    <NetworkMarker
      v-for="n in networkPoints"
      :key="n.id"
      :lng-lat="n.lngLat"
      :type="n.type"
      :label="n.label"
      :code="n.code"
    />

    <!-- Fleet — one marker per trip; hidden when a different trip is selected. -->
    <FleetTruckMarker
      v-for="m in truckPoints"
      :key="m.id"
      :lng-lat="m.lngLat"
      :tone="TONE_CSS[m.tone]"
      :progress="m.progress"
      :selected="selectedId === m.id"
      :hidden="!!selectedId && selectedId !== m.id"
      @select="emit('select', m.id)"
    />

    <!-- Selected trip itinerary: origin · stops · destination, with labels. -->
    <TripItineraryMarkers
      v-if="itinerary"
      :tone="TONE_CSS[itinerary.tone]"
      :origin="itinerary.origin"
      :dest="itinerary.dest"
      :stops="itinerary.stops"
    />
  </MapboxMap>
</template>
