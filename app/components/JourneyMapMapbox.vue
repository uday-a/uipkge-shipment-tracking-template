<script setup lang="ts">
/**
 * JourneyMapMapbox — a ground movement's route physically on a Mapbox map:
 * origin (DC / warehouse) → real road polyline → destination, with stop
 * waypoints and the vehicle marker at the movement's current progress.
 *
 * Client-only (wrap usage in <ClientOnly>). Marker DOM is inline-styled because
 * Mapbox relocates it out of the component subtree, so scoped styles wouldn't
 * reach it — same constraint as ContainerMap. Sibling of the stylised
 * <JourneyMap> arc, used when the movement has baked road geometry.
 */
import { computed } from 'vue'
import { MapboxMap, MapboxMarker } from '@studiometa/vue-mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Flag, Truck, PackageCheck } from 'lucide-vue-next'
import type { GeoPoint } from '~/mocks/live'

const props = withDefaults(defineProps<{
  coords: GeoPoint[] // [lat, lng] road polyline, origin → destination
  stops?: GeoPoint[] // [lat, lng] intermediate waypoints
  progress: number
  originLabel: string
  destinationLabel: string
  delivered?: boolean
}>(), { stops: () => [], delivered: false })

const config = useRuntimeConfig()
const ROUTE = '#2dd4bf' // map line accent (hex is fine for map geometry)

// live.ts stores [lat, lng]; Mapbox wants [lng, lat].
const toLngLat = ([lat, lng]: GeoPoint): [number, number] => [lng, lat]
const line = computed(() => props.coords.map(toLngLat))
const origin = computed<[number, number]>(() => line.value[0] ?? [0, 0])
const dest = computed<[number, number]>(() => line.value[line.value.length - 1] ?? [0, 0])
const stopPts = computed(() => (props.stops ?? []).map(toLngLat))

// Vehicle spot: interpolated by distance-fraction along the polyline so it sits
// exactly where `progress` puts it on the real road geometry.
const vehicle = computed<[number, number]>(() => {
  const pts = line.value
  if (pts.length < 2) return pts[0] ?? [0, 0]
  const seg = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1])
  const total = pts.slice(1).reduce((sum, p, i) => sum + seg(pts[i]!, p), 0)
  let target = Math.min(1, Math.max(0, props.progress / 100)) * total
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!, len = seg(a, b)
    if (target <= len || i === pts.length - 1) {
      const t = len === 0 ? 0 : target / len
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    }
    target -= len
  }
  return pts[pts.length - 1]!
})

function onCreated(map: any) {
  const draw = () => {
    const data = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line.value } }
    if (map.getSource('jm-route')) {
      map.getSource('jm-route').setData(data)
    } else {
      map.addSource('jm-route', { type: 'geojson', data })
      map.addLayer({
        id: 'jm-route-line',
        type: 'line',
        source: 'jm-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROUTE, 'line-width': 3, 'line-opacity': 0.9 },
      })
    }
    const lngs = line.value.map((p) => p[0])
    const lats = line.value.map((p) => p[1])
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 46, duration: 0, maxZoom: 11 })
  }
  if (map.isStyleLoaded()) draw()
  else map.on('load', draw)
}

// Inline marker styles (Mapbox relocates DOM out of the scoped subtree).
function pin(bg: string) {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '22px', height: '22px', borderRadius: '9999px', background: bg, color: '#04201d',
    border: '2px solid rgba(255,255,255,0.92)', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
  } as const
}
const stopDot = {
  width: '10px', height: '10px', borderRadius: '9999px', background: '#5fe3d4',
  border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
} as const
const vehicleStyle = {
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
    :center="vehicle"
    :zoom="6"
    :attribution-control="false"
    @mb-created="onCreated"
  >
    <MapboxMarker :lng-lat="origin">
      <span :style="pin('#0ea5b7')" :title="originLabel"><MapPin :size="13" /></span>
    </MapboxMarker>

    <MapboxMarker v-for="(s, i) in stopPts" :key="i" :lng-lat="s">
      <span :style="stopDot" />
    </MapboxMarker>

    <MapboxMarker :lng-lat="dest">
      <span :style="pin('#2dd4bf')" :title="destinationLabel"><Flag :size="13" /></span>
    </MapboxMarker>

    <MapboxMarker :lng-lat="vehicle">
      <span :style="vehicleStyle" :title="delivered ? 'Delivered' : 'In transit'">
        <PackageCheck v-if="delivered" :size="16" />
        <Truck v-else :size="16" />
      </span>
    </MapboxMarker>
  </MapboxMap>
</template>
