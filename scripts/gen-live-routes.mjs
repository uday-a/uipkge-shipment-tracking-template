// One-shot generator: fetch real driving geometry from Mapbox Directions for
// each live trip and bake it into app/mocks/live.ts as static [lat, lng]
// polylines (so routes follow real roads but the runtime stays offline).
// Run: node scripts/gen-live-routes.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const TOKEN = readFileSync('.env', 'utf8').match(/MAPBOX_ACCESS_TOKEN=(.+)/)[1].trim()

// [lat, lng] per city — origin / corridor waypoint / destination.
const CITY = {
  'Los Angeles': [34.05, -118.24], Phoenix: [33.45, -112.07], Chicago: [41.88, -87.63],
  Denver: [39.74, -104.99], Boston: [42.36, -71.06], 'New York': [40.71, -74.01],
  Detroit: [42.33, -83.05], Atlanta: [33.75, -84.39], Seattle: [47.61, -122.33],
  Portland: [45.52, -122.68], 'San Francisco': [37.77, -122.42], 'Kansas City': [39.1, -94.58],
  Minneapolis: [44.98, -93.27], Newark: [40.74, -74.17], Houston: [29.76, -95.37],
  Dallas: [32.78, -96.8], Miami: [25.76, -80.19], Orlando: [28.54, -81.38], Oakland: [37.8, -122.27],
  Blythe: [33.61, -114.6], Lincoln: [40.81, -96.7], Hartford: [41.76, -72.69], Nashville: [36.16, -86.78],
  Olympia: [47.04, -122.9], SFO: [37.62, -122.38], 'Daly City': [37.7, -122.47], 'Des Moines': [41.59, -93.62],
  Cleveland: [41.5, -81.69], Manhattan: [40.78, -73.97], Huntsville: [30.72, -95.55], Albuquerque: [35.08, -106.65],
  Madison: [43.07, -89.4], Gainesville: [29.65, -82.32], Providence: [41.82, -71.41], Boise: [43.62, -116.2],
  Rockford: [42.27, -89.09], 'West Palm Beach': [26.71, -80.05], 'Bay Bridge': [37.8, -122.37],
  Salina: [38.84, -97.61], Gary: [41.59, -87.35], Gilroy: [37.01, -121.57], 'New Haven': [41.31, -72.92],
}

const TRIPS = [
  ['SHP-100412', ['Los Angeles', 'Blythe', 'Phoenix']],
  ['SHP-100408', ['Chicago', 'Lincoln', 'Denver']],
  ['SHP-100401', ['Boston', 'Hartford', 'New York']],
  ['SHP-100390', ['Detroit', 'Nashville', 'Atlanta']],
  ['SHP-100385', ['Seattle', 'Olympia', 'Portland']],
  ['SHP-100379', ['San Francisco', 'Daly City', 'SFO']],
  ['SHP-100372', ['Kansas City', 'Des Moines', 'Minneapolis']],
  ['SHP-100364', ['Portland', 'Olympia', 'Seattle']],
  ['SHP-100351', ['New York', 'Cleveland', 'Chicago']],
  ['SHP-100342', ['Newark', 'Manhattan', 'New York']],
  ['SHP-100338', ['Houston', 'Huntsville', 'Dallas']],
  ['SHP-100327', ['Denver', 'Albuquerque', 'Phoenix']],
  ['SHP-100322', ['Minneapolis', 'Madison', 'Chicago']],
  ['SHP-100309', ['Atlanta', 'Gainesville', 'Miami']],
  ['SHP-100298', ['Boston', 'Providence', 'Newark']],
  ['SHP-100284', ['Seattle', 'Boise', 'Denver']],
  ['SHP-100271', ['Chicago', 'Rockford', 'Minneapolis']],
  ['SHP-100265', ['Miami', 'West Palm Beach', 'Orlando']],
  ['SHP-100253', ['San Francisco', 'Bay Bridge', 'Oakland']],
  ['SHP-100247', ['Los Angeles', 'Blythe', 'Phoenix']],
  ['SHP-100228', ['Denver', 'Salina', 'Kansas City']],
  ['SHP-100215', ['Detroit', 'Gary', 'Chicago']],
  ['SHP-100202', ['San Francisco', 'Gilroy', 'Los Angeles']],
  ['SHP-100183', ['New York', 'New Haven', 'Boston']],
  ['SHP-100171', ['Portland', 'Olympia', 'Seattle']],
]

const r5 = (n) => Math.round(n * 1e5) / 1e5

async function geometry(cities) {
  const pts = cities.map((c) => `${CITY[c][1]},${CITY[c][0]}`).join(';') // lng,lat
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pts}?geometries=geojson&overview=simplified&access_token=${TOKEN}`
  const res = await fetch(url)
  const json = await res.json()
  if (json.code !== 'Ok') throw new Error(`${cities.join('→')}: ${json.code} ${json.message ?? ''}`)
  // API returns [lng, lat]; store [lat, lng].
  return json.routes[0].geometry.coordinates.map(([lng, lat]) => [r5(lat), r5(lng)])
}

const out = []
for (const [id, cities] of TRIPS) {
  const coords = await geometry(cities)
  out.push({ id, coords })
  console.error(`${id}  ${cities.join(' → ').padEnd(40)} ${coords.length} pts`)
}

const body = out
  .map((t) => `  { shipmentId: '${t.id}', coords: ${JSON.stringify(t.coords)} },`)
  .join('\n')

writeFileSync('scripts/.live-routes.generated.txt', body)
console.error(`\nWrote ${out.length} trips → scripts/.live-routes.generated.txt`)
