<script setup lang="ts">
/**
 * ContainerMap — the inbound ocean journey physically on a Mapbox map:
 * origin port → Pacific arc → destination US port → import warehouse, with the
 * vessel marker placed at the container's current progress. Client-only (wrap
 * the usage in <ClientOnly>). Marker DOM is inline-styled because Mapbox
 * relocates it out of the component subtree (scoped styles wouldn't reach it).
 */
import { computed } from 'vue'
import { MapboxMap, MapboxMarker } from '@studiometa/vue-mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Anchor, Ship, Warehouse } from 'lucide-vue-next'
import { containerGeo, type BikeContainer } from '~/mocks/containers'

const props = defineProps<{ container: BikeContainer }>()
const config = useRuntimeConfig()
const geo = computed(() => containerGeo(props.container))

const ROUTE = '#2dd4bf' // map line accent (hex is fine for map geometry)

function onCreated(map: any) {
  const draw = () => {
    const line = geo.value.line
    const data = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } }
    if (map.getSource('ctr-route')) {
      map.getSource('ctr-route').setData(data)
    } else {
      map.addSource('ctr-route', { type: 'geojson', data })
      map.addLayer({
        id: 'ctr-route-line',
        type: 'line',
        source: 'ctr-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROUTE, 'line-width': 2.5, 'line-dasharray': [1.5, 1.6], 'line-opacity': 0.9 },
      })
    }
    const lngs = line.map((p) => p[0])
    const lats = line.map((p) => p[1])
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 54, duration: 0 })
  }
  if (map.isStyleLoaded()) draw()
  else map.on('load', draw)
}

const wrap = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', pointerEvents: 'none' } as const
const label = {
  background: 'rgba(10,15,14,0.82)', color: '#e6f7f3', border: '1px solid rgba(255,255,255,0.16)',
  padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap',
} as const
function dot(type: string) {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '20px', height: '20px', borderRadius: type === 'warehouse' ? '6px' : '9999px',
    background: type === 'warehouse' ? '#2dd4bf' : '#0ea5b7', color: '#04201d',
    border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
  } as const
}
const vessel = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px',
  borderRadius: '9999px', background: '#2dd4bf', color: '#04201d', border: '2px solid #fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
} as const
</script>

<template>
  <MapboxMap
    class="absolute inset-0 size-full"
    :access-token="(config.public.mapboxToken as string)"
    map-style="mapbox://styles/mapbox/dark-v11"
    :center="[200, 28]"
    :zoom="1.5"
    :attribution-control="false"
    @mb-created="onCreated"
  >
    <MapboxMarker v-for="(m, i) in geo.markers" :key="i" :lng-lat="m.lngLat">
      <div :style="wrap">
        <span :style="dot(m.type)">
          <component :is="m.type === 'warehouse' ? Warehouse : Anchor" :size="13" />
        </span>
        <span :style="label">{{ m.label }}</span>
      </div>
    </MapboxMarker>

    <MapboxMarker :lng-lat="geo.vessel">
      <span :style="vessel" :title="container.vessel" :aria-label="container.vessel"><Ship :size="16" /></span>
    </MapboxMarker>
  </MapboxMap>
</template>
