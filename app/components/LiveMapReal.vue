<script setup lang="ts">
/**
 * LiveMapReal — a real, projected geographic map (Leaflet) for the live
 * fleet view. Instead of depending on a tile server (which may be blocked
 * or offline), it renders an actual vector basemap of the US states
 * (us-atlas / US Census geometry, served from /public) that Leaflet
 * projects to Web Mercator. Routes are real lat/lng polylines split into a
 * travelled (status-coloured) + remaining (dashed) leg at each shipment's
 * progress, with truck markers that select a trip on click.
 *
 * Because the basemap is bundled vector data, the map renders identically
 * online and offline — no grey tiles, ever. Client-only (Leaflet needs
 * `window`); the page shows the stylized LiveMap as the SSR fallback.
 */
import { onMounted, onBeforeUnmount, watch } from 'vue'
import type { ResolvedTrip } from '~/mocks/live'
import type { Tone } from '~/mocks/shipments'
import { STATUS_LABELS } from '~/mocks/shipments'

const props = defineProps<{ trips: ResolvedTrip[]; selectedId: string | null }>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const { theme } = useTheme()

const el = ref<HTMLElement | null>(null)
let L: any = null
let map: any = null
let basemap: any = null
const layers = new Map<string, { base: any; travelled: any; remaining: any; origin: any; marker: any; truck: [number, number] }>()

const TONE_VAR: Record<Tone, string> = {
  success: '--success', info: '--info', warning: '--warning', destructive: '--destructive', muted: '--muted-foreground',
}
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#6366f1'
}
const toneColor = (t: Tone) => cssVar(TONE_VAR[t])

function basemapStyle() {
  return { color: cssVar('--border'), weight: 1, fillColor: cssVar('--card'), fillOpacity: 1 }
}

function splitByProgress(coords: [number, number][], progress: number) {
  const segs: { a: [number, number]; b: [number, number]; d: number }[] = []
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1]!, b = coords[i]!
    segs.push({ a, b, d: Math.hypot(b[0] - a[0], b[1] - a[1]) }); total += segs[segs.length - 1]!.d
  }
  const target = total * Math.min(1, Math.max(0, progress / 100))
  let acc = 0, truck: [number, number] = coords[coords.length - 1]!, cut = segs.length - 1
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]!
    if (acc + s.d >= target) {
      const r = s.d ? (target - acc) / s.d : 0
      truck = [s.a[0] + (s.b[0] - s.a[0]) * r, s.a[1] + (s.b[1] - s.a[1]) * r]
      cut = i; break
    }
    acc += s.d
  }
  return { truck, travelled: [...coords.slice(0, cut + 1), truck], remaining: [truck, ...coords.slice(cut + 1)] }
}

function truckIcon(color: string, active: boolean) {
  const size = active ? 38 : 32
  const svg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${cssVar('--card')};border:3px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center">${svg}</div>`
  return L.divIcon({ html, className: 'lm-truck', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

function applySelection() {
  const sel = props.selectedId
  layers.forEach((lyr, id) => {
    const dim = sel !== null && sel !== id
    const op = dim ? 0.25 : 1
    lyr.base.setStyle({ opacity: op * 0.5 })
    lyr.travelled.setStyle({ opacity: op })
    lyr.remaining.setStyle({ opacity: op * 0.8 })
    lyr.origin.setStyle({ opacity: op, fillOpacity: op })
    lyr.marker.setOpacity(dim ? 0.4 : 1)
    lyr.marker.setZIndexOffset(sel === id ? 1000 : 0)
  })
  if (sel && map && layers.has(sel)) map.panTo(layers.get(sel)!.truck, { animate: true })
}

function drawRoutes() {
  layers.forEach((l) => { [l.base, l.travelled, l.remaining, l.origin, l.marker].forEach((x) => map.removeLayer(x)) })
  layers.clear()
  const allPts: [number, number][] = []
  for (const t of props.trips) {
    const color = toneColor(t.tone)
    const { truck, travelled, remaining } = splitByProgress(t.coords, t.shipment.progress)
    allPts.push(...t.coords)
    const base = L.polyline(t.coords, { color: cssVar('--muted-foreground'), weight: 2, opacity: 0.4 }).addTo(map)
    const remainingLine = L.polyline(remaining, { color: cssVar('--muted-foreground'), weight: 3, opacity: 0.7, dashArray: '2 8', lineCap: 'round' }).addTo(map)
    const travelledLine = L.polyline(travelled, { color, weight: 4, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(map)
    const origin = L.circleMarker(t.coords[0], { radius: 4, color, weight: 2, fillColor: cssVar('--card'), fillOpacity: 1 }).addTo(map)
    const marker = L.marker(truck, { icon: truckIcon(color, false), riseOnHover: true }).addTo(map)
    marker.on('click', () => emit('select', t.shipment.id))
    marker.bindTooltip(`${t.shipment.id} · ${STATUS_LABELS[t.shipment.status]}`, { direction: 'top', offset: [0, -18] })
    layers.set(t.shipment.id, { base, travelled: travelledLine, remaining: remainingLine, origin, marker, truck })
  }
  if (allPts.length) map.fitBounds(allPts, { padding: [70, 70], maxZoom: 6 })
  applySelection()
}

onMounted(async () => {
  L = (await import('leaflet')).default
  if (!el.value) return
  map = L.map(el.value, { zoomControl: false, attributionControl: true, scrollWheelZoom: true, minZoom: 3, maxZoom: 10 })
  map.setView([39.5, -98.35], 4)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  map.attributionControl.addAttribution('Boundaries &copy; US Census · us-atlas')

  try {
    const [topo, topojson] = await Promise.all([
      fetch('/geo/us-states.json').then((r) => r.json()),
      import('topojson-client'),
    ])
    const geo = topojson.feature(topo, topo.objects.states)
    basemap = L.geoJSON(geo, { style: basemapStyle, interactive: false }).addTo(map)
  } catch {
    // If the basemap asset is missing, the routes still render on the bg.
  }

  drawRoutes()
  requestAnimationFrame(() => map && map.invalidateSize())
  setTimeout(() => map && map.invalidateSize(), 250)
})

watch(() => props.selectedId, applySelection)
watch(() => props.trips, drawRoutes, { deep: true })
watch(theme, () => {
  if (!map) return
  if (basemap) basemap.setStyle(basemapStyle())
  setTimeout(drawRoutes, 0)
})

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null }
  layers.clear()
})
</script>

<template>
  <div ref="el" class="size-full" />
</template>

<style scoped>
:deep(.leaflet-container) {
  background: var(--muted);
  font-family: var(--font-sans);
}
:deep(.leaflet-pane),
:deep(.leaflet-top),
:deep(.leaflet-bottom) {
  z-index: 1;
}
:deep(.leaflet-control-zoom a) {
  border-radius: 9999px !important;
  color: var(--foreground);
  background: var(--card);
  border-color: var(--border);
}
:deep(.leaflet-control-attribution) {
  background: color-mix(in oklch, var(--card) 80%, transparent);
  color: var(--muted-foreground);
}
:deep(.lm-truck) { background: transparent; border: 0; }
</style>
