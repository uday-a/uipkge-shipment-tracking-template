<script setup lang="ts">
/** A fixed network facility on the fleet map: an import warehouse (labelled
 *  square hub with a warehouse glyph) or a distribution center (small outlined
 *  square node). Presentational only. Must render inside <MapboxMap>'s slot so
 *  the inner <MapboxMarker> injects the map. Styles are the global .lm-* rules
 *  in app/assets/css/live-map.css (Mapbox relocates marker DOM, so scoped
 *  styles wouldn't reach it). */
import { MapboxMarker } from '@studiometa/vue-mapbox-gl'

defineProps<{
  lngLat: [number, number]
  type: 'warehouse' | 'dc'
  label: string
  code: string
}>()
</script>

<template>
  <MapboxMarker :lng-lat="lngLat">
    <div class="lm-marker">
      <template v-if="type === 'warehouse'">
        <MarkerLabel>{{ label }}</MarkerLabel>
        <span class="lm-hub">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 21V8.5L12 3l9 5.5V21" />
            <path d="M3 21h18" />
            <path d="M8.5 21v-6h7v6" />
          </svg>
        </span>
      </template>
      <template v-else>
        <MarkerLabel variant="sm">{{ code }}</MarkerLabel>
        <span class="lm-dc" :title="label" />
      </template>
    </div>
  </MapboxMarker>
</template>
