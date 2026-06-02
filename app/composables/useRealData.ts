import { ref } from 'vue'

/**
 * Real-data flag.
 *
 * Iter-29 carry-over closer (named in iter-27/iter-28): the dev-only
 * `dev · mock` chip in the dashboard header was hardcoded to
 * `import.meta.dev`, which is honest for normal dev runs but dishonest
 * the moment a developer hooks a real API into the page while still on a
 * dev build. The chip would keep advertising "mock data" while the
 * surface actually rendered live data — a slow trust kill during the
 * eventual real-data swap.
 *
 * `useRealData()` exposes a module-scoped reactive boolean (defaults
 * `false` — every consumer today is mock-backed). Two helpers:
 *
 *   - `set(next: boolean)` flips the flag. The eventual `useFetch`-backed
 *     dashboard data layer will call `set(true)` once its data has
 *     landed, so the chip hides automatically.
 *   - `enabled` is the reactive ref consumers bind to with `v-if`.
 *
 * Today the only consumer is the dashboard header chip's `v-if` guard
 * (`isDev && !realData`). Future consumers might include:
 *   - A `MOCK_TODAY_UTC` reactive computed (carry-over from iter-28)
 *     that pivots to `new Date()` truncation when `realData` is true.
 *   - A "Demo mode" banner that surfaces ONLY when `!realData` AND
 *     we're on a production build (e.g. a public marketing demo).
 *
 * SSR-safe: pure reactive state, no DOM access, no timers. Module-scoped
 * so all consumers share a single source of truth — the same pattern
 * iter-25 introduced with `useTimeZone()` / `useCommandPalette()`.
 */
const enabled = ref<boolean>(false)

export function useRealData() {
  return {
    /** Reactive flag — `true` when the page is rendering real (non-mock) data. */
    enabled,
    /** Flip the flag. Real-data adapters call `set(true)` once their fetch lands. */
    set(next: boolean) {
      enabled.value = next
    },
  }
}
