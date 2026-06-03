<script setup lang="ts">
/** One vehicle marker at a trip's current position. A white-ringed status dot
 *  at rest; a labelled truck puck when its trip is selected; hidden (v-show,
 *  never opacity — Mapbox overwrites marker opacity each render) when a
 *  different trip is selected. Must render inside <MapboxMap>'s slot so the
 *  inner <MapboxMarker> injects the map. `tone` is a resolved CSS-var string. */
import { MapboxMarker } from '@studiometa/vue-mapbox-gl'
import { Truck } from 'lucide-vue-next'

defineProps<{
  lngLat: [number, number]
  tone: string
  progress: number
  selected: boolean
  hidden: boolean
}>()
defineEmits<{ (e: 'select'): void }>()
</script>

<template>
  <MapboxMarker :lng-lat="lngLat">
    <div v-show="!hidden" class="lm-marker" role="button" @click="$emit('select')">
      <template v-if="selected">
        <MarkerLabel>Current · {{ progress }}%</MarkerLabel>
        <span class="lm-puck" :style="{ background: tone }"><Truck class="size-3.5 text-white" /></span>
      </template>
      <span v-else class="lm-dot" :style="{ background: tone }" />
    </div>
  </MapboxMarker>
</template>
