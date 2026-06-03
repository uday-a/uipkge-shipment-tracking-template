/**
 * useFleetMap — all the imperative Mapbox work for the live fleet map: the
 * desaturated basemap repaint, the per-trip route line layers (casing +
 * travelled core + dashed remaining), selection/hover focus, fit/fly, and the
 * theme→restyle chain. The markers are declarative Vue components in the SFC;
 * this composable never touches them — it only owns the map instance and the
 * line layers. The map instance is kept in closure state and never returned,
 * keeping the declarative-marker and imperative-route concerns separated.
 *
 * `toLngLat` + `splitByProgress` are pure and exported so the SFC's marker
 * view-model places each truck on exactly the route's cut point.
 */
import { ref, computed, watch, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import mapboxgl from 'mapbox-gl'
import type { ResolvedTrip } from '~/mocks/live'
import type { Tone } from '~/mocks/shipments'

/** [lat,lng] → [lng,lat] (Mapbox order). Pure. */
export function toLngLat(coords: [number, number][]): [number, number][] {
  return coords.map(([lat, lng]) => [lng, lat])
}

/** Split a route at the truck's progress; returns the truck point + travelled
 *  and remaining legs. Pure + deterministic (SSR-safe). */
export function splitByProgress(coords: [number, number][], progress: number) {
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

// Zoom-interpolated route width ramps.
const W_CORE: any = ['interpolate', ['linear'], ['zoom'], 4, 3, 8, 4, 12, 5]
const W_CORE_SEL: any = ['interpolate', ['linear'], ['zoom'], 4, 4.5, 8, 6, 12, 7]
const W_CASING: any = ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 6, 12, 7.5]
const W_CASING_SEL: any = ['interpolate', ['linear'], ['zoom'], 4, 7, 8, 9, 12, 11]
const W_REMAIN: any = ['interpolate', ['linear'], ['zoom'], 4, 2, 10, 2.75]

const TONE_VAR: Record<Tone, string> = {
  success: '--success', info: '--info', warning: '--warning', destructive: '--destructive', muted: '--muted-foreground',
}

export interface FleetMap {
  onMapCreated: (map: mapboxgl.Map) => void
  hover: (id: string | null) => void
  mapStyle: ComputedRef<string>
}

export function useFleetMap(opts: { trips: Ref<ResolvedTrip[]>; selectedId: Ref<string | null> }): FleetMap {
  const { theme } = useTheme()
  const config = useRuntimeConfig()
  const isDark = () => theme.value === 'dark'

  let map: any = null
  const mapReady = ref(false)
  const hoverId = ref<string | null>(null)

  // Mapbox line paint can't read oklch() tokens — resolve each to rgb via a
  // canvas pixel. Cached; cleared on theme change. (Route layers only — markers
  // read CSS vars directly in the DOM.)
  const colorCache = new Map<string, string>()
  let paintCtx: CanvasRenderingContext2D | null = null
  function cssVar(name: string): string {
    const hit = colorCache.get(name)
    if (hit) return hit
    const probe = document.createElement('span')
    probe.style.color = `var(${name}, #0e6e69)`
    probe.style.display = 'none'
    document.body.appendChild(probe)
    const computed = getComputedStyle(probe).color
    probe.remove()
    let resolved = computed || '#0e6e69'
    if (!paintCtx) paintCtx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    if (paintCtx) {
      try {
        paintCtx.clearRect(0, 0, 1, 1)
        paintCtx.fillStyle = computed
        paintCtx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = paintCtx.getImageData(0, 0, 1, 1).data
        resolved = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a! / 255).toFixed(3)})`
      } catch { /* keep computed */ }
    }
    colorCache.set(name, resolved)
    return resolved
  }
  const toneColor = (t: Tone) => cssVar(TONE_VAR[t])
  const casingColor = () => (isDark() ? 'rgb(14,16,16)' : 'rgb(255,255,255)')
  const neutralColor = () => cssVar('--muted-foreground')

  const mapStyle = computed(() => (isDark() ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'))

  // ── Basemap repaint ──────────────────────────────────────────────────────
  function applyBasemapStyle() {
    if (!map) return
    const P = isDark()
      ? { land: 'rgb(22,26,26)', water: 'rgb(16,19,19)', use: 'rgb(30,34,34)', road: 'rgb(48,54,54)', label: 'rgb(150,154,152)', halo: 'rgb(22,26,26)', admin: 'rgb(48,54,54)' }
      : { land: 'rgb(247,246,243)', water: 'rgb(225,229,230)', use: 'rgb(240,240,236)', road: 'rgb(223,224,220)', label: 'rgb(120,123,128)', halo: 'rgb(247,246,243)', admin: 'rgb(214,215,211)' }
    const styleLayers = map.getStyle()?.layers ?? []
    for (const l of styleLayers) {
      const id: string = l.id
      try {
        if (id === 'background' || id === 'land') map.setPaintProperty(id, 'background-color', P.land)
        else if (/water/.test(id) && l.type === 'fill') map.setPaintProperty(id, 'fill-color', P.water)
        else if (/landuse|landcover|national-park/.test(id) && l.type === 'fill') {
          map.setPaintProperty(id, 'fill-color', P.use)
          if (id === 'national-park') map.setPaintProperty(id, 'fill-opacity', 0.4)
        } else if (/^road-(motorway|trunk|primary)/.test(id) && l.type === 'line') {
          map.setPaintProperty(id, 'line-color', P.road)
          map.setPaintProperty(id, 'line-opacity', 0.55)
          map.setPaintProperty(id, 'line-width', ['interpolate', ['linear'], ['zoom'], 4, 0.4, 8, 0.9, 12, 1.4])
        } else if (/^road-(secondary|tertiary|street|minor|service|path|pedestrian)/.test(id)) {
          map.setLayoutProperty(id, 'visibility', 'none')
        } else if (/poi|transit|airport|natural-point|water-point|waterway-label|building|settlement-subdivision-label/.test(id)) {
          map.setLayoutProperty(id, 'visibility', 'none')
        } else if (/road-label|settlement-major-label|settlement-minor-label|state-label/.test(id) && l.type === 'symbol') {
          map.setPaintProperty(id, 'text-color', P.label)
          map.setPaintProperty(id, 'text-halo-color', P.halo)
          map.setPaintProperty(id, 'text-halo-width', 1)
          map.setPaintProperty(id, 'text-opacity', 0.6)
        } else if (id === 'admin-1-boundary' && l.type === 'line') {
          map.setPaintProperty(id, 'line-color', P.admin)
          map.setPaintProperty(id, 'line-opacity', 0.6)
          map.setPaintProperty(id, 'line-width', 0.6)
        } else if (id === 'admin-1-boundary-bg') map.setPaintProperty(id, 'line-opacity', 0)
      } catch { /* layer absent / wrong type — skip */ }
    }
    try {
      map.setFog({ color: P.land, 'high-color': P.use, 'horizon-blend': 0.02, 'space-color': P.water, 'star-intensity': 0 })
    } catch { /* skip */ }
  }

  // ── Routes (imperative line layers) ──────────────────────────────────────
  const routes = new Map<string, { travelledSource: string; remainingSource: string; casingLayer: string; travelledLayer: string; remainingLayer: string; color: string }>()

  function addRoute(t: ResolvedTrip) {
    const id = t.shipment.id
    const color = toneColor(t.tone)
    const { travelled, remaining } = splitByProgress(t.coords, t.shipment.progress)
    const base = `trip-${id}`
    const sT = `${base}-t`, sR = `${base}-r`, lC = `${base}-casing`, lT = `${base}-core`, lR = `${base}-remain`
    map.addSource(sT, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: toLngLat(travelled) } } })
    map.addSource(sR, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: toLngLat(remaining) } } })
    map.addLayer({ id: lR, type: 'line', source: sR, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': W_REMAIN, 'line-opacity': 0.3, 'line-dasharray': [1.5, 3] } })
    map.addLayer({ id: lC, type: 'line', source: sT, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': casingColor(), 'line-width': W_CASING, 'line-opacity': isDark() ? 0.8 : 0.9 } })
    map.addLayer({ id: lT, type: 'line', source: sT, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': W_CORE, 'line-opacity': 1 } })
    routes.set(id, { travelledSource: sT, remainingSource: sR, casingLayer: lC, travelledLayer: lT, remainingLayer: lR, color })
  }

  function removeRoutes() {
    if (!map) return
    routes.forEach((r) => {
      [r.casingLayer, r.travelledLayer, r.remainingLayer].forEach((l) => { if (map.getLayer(l)) map.removeLayer(l) })
      ;[r.travelledSource, r.remainingSource].forEach((s) => { if (map.getSource(s)) map.removeSource(s) })
    })
    routes.clear()
  }

  function drawRoutes() {
    if (!map || !mapReady.value) return
    removeRoutes()
    for (const t of opts.trips.value) addRoute(t)
    applyRouteFocus()
  }

  function applyRouteFocus() {
    if (!map || !mapReady.value) return
    const selId = opts.selectedId.value
    const focusId = selId ?? hoverId.value
    const neutral = neutralColor()
    routes.forEach((r, id) => {
      const isFocus = id === focusId
      const dim = focusId !== null && !isFocus
      if (map.getLayer(r.travelledLayer)) {
        map.setPaintProperty(r.travelledLayer, 'line-color', dim ? neutral : r.color)
        map.setPaintProperty(r.travelledLayer, 'line-opacity', dim ? 0.18 : 1)
        map.setPaintProperty(r.travelledLayer, 'line-width', isFocus ? W_CORE_SEL : W_CORE)
      }
      if (map.getLayer(r.casingLayer)) {
        map.setPaintProperty(r.casingLayer, 'line-opacity', dim ? 0.12 : isDark() ? 0.8 : 0.9)
        map.setPaintProperty(r.casingLayer, 'line-width', isFocus ? W_CASING_SEL : W_CASING)
      }
      if (map.getLayer(r.remainingLayer)) map.setPaintProperty(r.remainingLayer, 'line-opacity', dim ? 0.08 : 0.3)
    })
  }

  function fitFleet() {
    if (!map) return
    const el = map.getContainer()
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return
    const b = new mapboxgl.LngLatBounds()
    let has = false
    for (const t of opts.trips.value) for (const c of t.coords) { b.extend(toLngLat([c])[0]!); has = true }
    if (has) map.fitBounds(b, { padding: { top: 56, right: 56, bottom: 56, left: 56 }, maxZoom: 6.5, duration: 600 })
  }

  function flyToSelected() {
    const sel = opts.selectedId.value
    const t = sel ? opts.trips.value.find((tr) => tr.shipment.id === sel) : null
    if (!t || !map) return
    const el = map.getContainer()
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return
    const b = new mapboxgl.LngLatBounds()
    for (const c of t.coords) b.extend(toLngLat([c])[0]!)
    // right:380 keeps the route clear of the 340px inspector drawer + margin.
    map.fitBounds(b, { padding: { top: 72, right: 380, bottom: 72, left: 72 }, maxZoom: 11, duration: 700 })
  }

  /** Emphasize a lane on rail-card hover (no flyTo). */
  function hover(id: string | null) {
    hoverId.value = id
    applyRouteFocus()
  }

  function onMapCreated(mapInstance: mapboxgl.Map) {
    map = mapInstance
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    const init = () => {
      mapReady.value = true
      // Defensive: ensure the container has non-zero dimensions before any
      // camera operation — fitBounds with a 0×0 container corrupts the transform.
      requestAnimationFrame(() => {
        const el = map.getContainer()
        if (el && (el.clientWidth === 0 || el.clientHeight === 0)) {
          map.resize()
        }
        applyBasemapStyle()
        drawRoutes()
        fitFleet()
      })
    }
    if (map.loaded()) init()
    else map.on('load', init)
    map.on('style.load', () => { if (mapReady.value) { applyBasemapStyle(); drawRoutes() } })
  }

  watch(opts.selectedId, () => { applyRouteFocus(); flyToSelected() })
  watch(opts.trips, drawRoutes, { deep: true })
  // The mapStyle prop change drives setStyle → style.load → repaint; here we
  // just drop the cached oklch→rgb route colours so they re-resolve per theme.
  watch(theme, () => { colorCache.clear() })

  onBeforeUnmount(() => { if (map) { map.remove(); map = null } })

  return { onMapCreated, hover, mapStyle }
}
