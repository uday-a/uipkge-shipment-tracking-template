<script setup lang="ts">
/** The selected trip's full itinerary: origin start-node, intermediate stop
 *  node(s), and the destination teardrop pin — each with a label. Presentational
 *  only (no emits); selection comes from the truck marker / rail. Must render
 *  inside <MapboxMap>'s slot so the inner <MapboxMarker>s inject the map.
 *  `tone` is a resolved CSS-var string. */
import { MapboxMarker } from '@studiometa/vue-mapbox-gl'

interface Node { lngLat: [number, number]; label: string }

defineProps<{
  tone: string
  origin: Node
  dest: Node
  stops: Node[]
}>()
</script>

<template>
  <!-- Origin -->
  <MapboxMarker :lng-lat="origin.lngLat">
    <div class="lm-marker">
      <MarkerLabel>Origin · {{ origin.label }}</MarkerLabel>
      <span class="lm-node" :style="{ borderColor: tone }">
        <span class="lm-node-dot" :style="{ background: tone }" />
      </span>
    </div>
  </MapboxMarker>

  <!-- Intermediate stops -->
  <MapboxMarker v-for="(s, i) in stops" :key="`stop-${i}`" :lng-lat="s.lngLat">
    <div class="lm-marker">
      <MarkerLabel variant="sm">{{ s.label }}</MarkerLabel>
      <span class="lm-stop" :style="{ borderColor: tone }" />
    </div>
  </MapboxMarker>

  <!-- Destination pin (tip on the coordinate) -->
  <MapboxMarker :lng-lat="dest.lngLat" anchor="bottom">
    <div class="lm-marker lm-marker-pin">
      <MarkerLabel>Destination · {{ dest.label }}</MarkerLabel>
      <svg viewBox="0 0 24 24" width="22" height="30" :style="{ color: tone }" class="lm-pin">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" stroke="#fff" stroke-width="1.5" />
        <circle cx="12" cy="9" r="2.3" fill="#fff" />
      </svg>
    </div>
  </MapboxMarker>
</template>
