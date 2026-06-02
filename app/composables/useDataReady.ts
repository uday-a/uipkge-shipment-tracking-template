import { ref, onMounted } from 'vue'

/**
 * Simulated async-data readiness flag.
 *
 * The mock surface is synchronous module imports, so every page has its
 * data "ready" the moment it renders. That doesn't match what a real
 * consumer will experience -- their KPI tiles, charts, and tables get
 * their data via `useFetch`/`useAsyncData` and have a visible loading
 * window. Skeletons exist for that window.
 *
 * Pages gate their loaded-state markup on this composable and render
 * `<Skeleton>` placeholders in the meantime.
 * The ref defaults to `false` (so SSR + initial client hydration both
 * paint skeletons -- no hydration mismatch) and flips to `true` after
 * the configured delay once the component is mounted.
 *
 * Usage:
 *   const ready = useDataReady(400)  // 400ms shimmer window
 *   <Skeleton v-if="!ready" class="..." />
 *   <RealContent v-else />
 *
 * Real consumers replace this composable with their actual data
 * fetcher's `pending` / `status` ref. The page-side template stays
 * identical, only the source of `ready` changes.
 */
export function useDataReady(delayMs = 400) {
  const ready = ref(false)

  onMounted(() => {
    if (delayMs <= 0) {
      ready.value = true
      return
    }
    const t = setTimeout(() => {
      ready.value = true
    }, delayMs)
    // Clean up if the component unmounts before the timer fires --
    // otherwise a fast-navigating user can flip readiness on a
    // teardown component and trigger a transient error.
    return () => clearTimeout(t)
  })

  return ready
}
