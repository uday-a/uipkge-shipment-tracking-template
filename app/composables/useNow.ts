import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Reactive "now" clock.
 *
 * Added in iter-24 to close the longest-open dashboard carry-over (since
 * iter-19, 5 iters running): the header weekday strip + "As of …" date
 * badge were hardcoded to `Mon, May 18 · 09:00 PT — day 1 of 5`, so the
 * most-visible temporal anchor on the page was a static lie that
 * desynced from the wall clock the moment a user loaded the surface on
 * any day other than canonical Monday morning.
 *
 * Returns a `Date` ref that updates every `intervalMs` (default 60_000 —
 * dashboard rarely cares about sub-minute precision, and a 60s tick
 * keeps the scheduler quiet enough for battery-sensitive laptops).
 *
 * SSR-safe: the initial value is captured once at composable-mount time
 * (which is on the client because the timer only attaches under
 * `onMounted`); SSR pre-render sees the `new Date()` from the server
 * pass, and the first client render hydrates with the same instant.
 * Drift between server-now and client-now is one render frame — well
 * inside the 60s tick window.
 *
 * Real consumers can pass a tighter `intervalMs` for second-by-second
 * clocks, or use `now.value.toLocaleTimeString(...)` directly with their
 * org's primary TZ. The dashboard surface keeps things mock-friendly by
 * passing canonical demo values through `formatHeaderDate()` (see
 * dashboard.vue) rather than `toLocaleString` so SSR + browser output
 * stay pixel-identical.
 */
export function useNow(intervalMs: number = 60_000) {
  const now = ref<Date>(new Date())
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    if (typeof window === 'undefined') return
    now.value = new Date()
    timer = setInterval(() => {
      now.value = new Date()
    }, intervalMs)
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return now
}
