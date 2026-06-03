<script setup lang="ts">
/**
 * LiveMapMapbox — real geographic fleet map powered by Mapbox GL JS.
 * Renders status-coloured route polylines and custom truck markers on
 * a projected vector basemap. Selecting a trip highlights its route and
 * pans the map to the truck. Client-only; falls back to LiveMap on SSR.
 */
import { onMounted, onBeforeUnmount, watch } from 'vue'
import type { ResolvedTrip } from '~/mocks/live'
import type { Tone } from '~/mocks/shipments'
import { STATUS_LABELS } from '~/mocks/shipments'

const props = defineProps<{ trips: ResolvedTrip[]; selectedId: string | null }>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const { theme } = useTheme()
const config = useRuntimeConfig()

const el = ref<HTMLElement | null>(null)
let mapboxgl: any = null
let map: any = null
const layers = new Map<string, {
  baseSource: string
  travelledSource: string
  remainingSource: string
  baseLayer: string
  travelledLayer: string
  remainingLayer: string
  originMarker: any
  truckMarker: any
  truckLngLat: [number, number]
}>()

const TONE_VAR: Record<Tone, string> = {
  success: '--success', info: '--info', warning: '--warning', destructive: '--destructive', muted: '--muted-foreground',
}

// Mapbox GL can't parse oklch() (our tokens are OKLCH), so resolve each
// custom property to an rgb()/hex string via a canvas. Cached per token;
// cleared on theme switch (tokens differ between light/dark).
const colorCache = new Map<string, string>()
let paintCtx: CanvasRenderingContext2D | null = null
function cssVar(name: string): string {
  const hit = colorCache.get(name)
  if (hit) return hit
  // Resolve the token (handles var() chains) to a concrete CSS colour…
  const probe = document.createElement('span')
  probe.style.color = `var(${name}, #6366f1)`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  // …then read an actual sRGB pixel — Chromium keeps oklch() in both
  // getComputedStyle and canvas.fillStyle, but getImageData is always rgb.
  let resolved = computed || '#6366f1'
  if (!paintCtx) paintCtx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (paintCtx) {
    try {
      paintCtx.clearRect(0, 0, 1, 1)
      paintCtx.fillStyle = computed
      paintCtx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = paintCtx.getImageData(0, 0, 1, 1).data
      resolved = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a! / 255).toFixed(3)})`
    } catch {
      /* keep computed */
    }
  }
  colorCache.set(name, resolved)
  return resolved
}
const toneColor = (t: Tone) => cssVar(TONE_VAR[t])

function toLngLat(coords: [number, number][]): [number, number][] {
  return coords.map(([lat, lng]) => [lng, lat])
}

function splitByProgress(coords: [number, number][], progress: number) {
  const segs: { a: [number, number]; b: [number, number]; d: number }[] = []
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1]!, b = coords[i]!
    const d = Math.hypot(b[0] - a[0], b[1] - a[1])
    segs.push({ a, b, d }); total += d
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

function createTruckElement(color: string, active: boolean): HTMLElement {
  const size = active ? 38 : 32
  const div = document.createElement('div')
  div.style.width = `${size}px`
  div.style.height = `${size}px`
  div.style.borderRadius = '9999px'
  div.style.background = cssVar('--card')
  div.style.border = `3px solid ${color}`
  div.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)'
  div.style.display = 'flex'
  div.style.alignItems = 'center'
  div.style.justifyContent = 'center'
  div.style.cursor = 'pointer'
  div.style.transition = 'all 0.15s'
  div.style.position = 'relative'
  div.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`
  // Pulse ring — hidden until the trip is selected (toggled in applySelection).
  const ring = document.createElement('div')
  ring.className = 'animate-ping'
  ring.dataset.ping = '1'
  ring.style.position = 'absolute'
  ring.style.inset = '-3px'
  ring.style.borderRadius = '9999px'
  ring.style.background = color
  ring.style.opacity = '0'
  ring.style.zIndex = '-1'
  div.appendChild(ring)
  return div
}

function createOriginElement(color: string): HTMLElement {
  const div = document.createElement('div')
  div.style.width = '10px'
  div.style.height = '10px'
  div.style.borderRadius = '9999px'
  div.style.background = cssVar('--card')
  div.style.border = `2px solid ${color}`
  return div
}

function mapStyle(isDark: boolean): string {
  return isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'
}

function addTrip(t: ResolvedTrip) {
  if (!map || !mapboxgl) return
  const id = t.shipment.id
  const color = toneColor(t.tone)
  const { truck, travelled, remaining } = splitByProgress(t.coords, t.shipment.progress)
  const travelledLngLat = toLngLat(travelled)
  const remainingLngLat = toLngLat(remaining)
  const allLngLat = toLngLat(t.coords)
  const truckLngLat = toLngLat([truck])[0]!

  const base = `trip-${id}`
  const sourceBase = `${base}-base`
  const sourceTravelled = `${base}-travelled`
  const sourceRemaining = `${base}-remaining`
  const layerBase = `${base}-layer-base`
  const layerTravelled = `${base}-layer-travelled`
  const layerRemaining = `${base}-layer-remaining`

  map.addSource(sourceBase, {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: allLngLat } }
  })
  map.addSource(sourceTravelled, {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: travelledLngLat } }
  })
  map.addSource(sourceRemaining, {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: remainingLngLat } }
  })

  map.addLayer({
    id: layerBase, type: 'line', source: sourceBase,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': cssVar('--muted-foreground'), 'line-width': 2, 'line-opacity': 0.35 }
  })
  map.addLayer({
    id: layerTravelled, type: 'line', source: sourceTravelled,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 1 }
  })
  map.addLayer({
    id: layerRemaining, type: 'line', source: sourceRemaining,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': cssVar('--muted-foreground'), 'line-width': 3, 'line-opacity': 0.6, 'line-dasharray': [2, 4] }
  })

  const originMarker = new mapboxgl.Marker({ element: createOriginElement(color), anchor: 'center' })
    .setLngLat(allLngLat[0]!)
    .addTo(map)

  const truckEl = createTruckElement(color, false)
  const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, closeOnClick: false })
    .setHTML(`<div style="font-family:var(--font-sans);font-size:12px;font-weight:600">${id}</div><div style="font-family:var(--font-sans);font-size:11px;color:var(--muted-foreground)">${STATUS_LABELS[t.shipment.status]}</div>`)

  truckEl.addEventListener('mouseenter', () => { popup.setLngLat(truckLngLat).addTo(map) })
  truckEl.addEventListener('mouseleave', () => { popup.remove() })
  truckEl.addEventListener('click', (e: Event) => { e.stopPropagation(); emit('select', id) })

  const truckMarker = new mapboxgl.Marker({ element: truckEl, anchor: 'center' })
    .setLngLat(truckLngLat)
    .addTo(map)

  layers.set(id, {
    baseSource: sourceBase, travelledSource: sourceTravelled, remainingSource: sourceRemaining,
    baseLayer: layerBase, travelledLayer: layerTravelled, remainingLayer: layerRemaining,
    originMarker, truckMarker, truckLngLat,
  })
}

function removeAllTrips() {
  if (!map) return
  layers.forEach((lyr) => {
    [lyr.baseLayer, lyr.travelledLayer, lyr.remainingLayer].forEach((lid) => {
      if (map!.getLayer(lid)) map!.removeLayer(lid)
    })
    ;[lyr.baseSource, lyr.travelledSource, lyr.remainingSource].forEach((sid) => {
      if (map!.getSource(sid)) map!.removeSource(sid)
    })
    lyr.originMarker.remove()
    lyr.truckMarker.remove()
  })
  layers.clear()
}

function drawAll() {
  if (!map || !map.loaded()) return
  removeAllTrips()
  const bounds = new mapboxgl.LngLatBounds()
  let hasPoints = false
  for (const t of props.trips) {
    addTrip(t)
    for (const c of t.coords) {
      bounds.extend(toLngLat([c])[0])
      hasPoints = true
    }
  }
  if (hasPoints) {
    map.fitBounds(bounds, { padding: 80, maxZoom: 12 })
  }
  applySelection()
}

function applySelection() {
  if (!map) return
  const sel = props.selectedId
  layers.forEach((lyr, id) => {
    const dim = sel !== null && sel !== id
    const op = dim ? 0.25 : 1
    const lineOp = dim ? 0.2 : 0.35
    const remainingOp = dim ? 0.2 : 0.6
    if (map!.getLayer(lyr.baseLayer)) map!.setPaintProperty(lyr.baseLayer, 'line-opacity', lineOp)
    if (map!.getLayer(lyr.travelledLayer)) map!.setPaintProperty(lyr.travelledLayer, 'line-opacity', op)
    if (map!.getLayer(lyr.remainingLayer)) map!.setPaintProperty(lyr.remainingLayer, 'line-opacity', remainingOp)
    const truckEl = lyr.truckMarker.getElement()
    if (truckEl) {
      truckEl.style.opacity = dim ? '0.4' : '1'
      const ring = truckEl.querySelector('[data-ping]') as HTMLElement | null
      if (ring) ring.style.opacity = sel === id ? '0.4' : '0'
    }
    const originEl = lyr.originMarker.getElement()
    if (originEl) originEl.style.opacity = dim ? '0.3' : '1'
  })
  if (sel && layers.has(sel) && map) {
    const { truckLngLat } = layers.get(sel)!
    map.flyTo({ center: truckLngLat, zoom: Math.max(map.getZoom(), 10), essential: true })
  }
}

function initMap() {
  if (!mapboxgl || !el.value) return
  const isDark = theme.value === 'dark'
  mapboxgl.accessToken = config.public.mapboxToken as string
  map = new mapboxgl.Map({
    container: el.value,
    style: mapStyle(isDark),
    projection: 'mercator',
    center: [-98.35, 39.5],
    zoom: 4,
    attributionControl: true,
  })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
  map.on('load', () => drawAll())
  map.on('style.load', () => drawAll())
}

onMounted(async () => {
  const mod = await import('mapbox-gl')
  mapboxgl = mod.default ?? mod
  initMap()
})

watch(() => props.selectedId, applySelection)
watch(() => props.trips, drawAll, { deep: true })

watch(theme, (newTheme) => {
  if (!map || !mapboxgl) return
  colorCache.clear() // tokens differ between light/dark — re-resolve on redraw
  map.setStyle(mapStyle(newTheme === 'dark'))
})

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null }
  layers.clear()
})
</script>

<template>
  <div ref="el" class="size-full" />
</template>
