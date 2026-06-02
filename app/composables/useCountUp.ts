import { ref, watch, type Ref } from 'vue'

/**
 * Shared rAF count-up ramp.
 *
 * Extracted in iter-16 from the donut-centre headline in `dashboard.vue`
 * so the four KPI tile numbers can share the exact same easing + duration
 * envelope. Before this, the donut centre ramped on `ready` flip while
 * the 4 KPI tile values (247 / 18 / 4.2% / 7) popped in fully-formed —
 * the band reads as a half-coordinated row.
 *
 * Behavior:
 *   - SSR-safe: the returned display ref defaults to `target` so the
 *     server-rendered markup matches the steady-state DOM.
 *   - On client, when `trigger` becomes truthy, ramps 0 → target over
 *     `duration` ms with easeOutCubic (same curve as the row-reveal).
 *   - Respects `prefers-reduced-motion: reduce` by jumping straight to
 *     target.
 *   - Honors `formatPrecision` (decimals) so percentage tiles like
 *     "4.2%" don't snap to integers during the ramp.
 *
 * Returns: `display` ref carrying the current animated number. Caller
 * is responsible for formatting (suffix `%`, etc.).
 */
export function useCountUp(
  target: number,
  trigger: Ref<boolean>,
  options: { duration?: number; precision?: number } = {},
) {
  const { duration = 600, precision = 0 } = options
  const display = ref(target)
  const factor = Math.pow(10, precision)

  watch(
    trigger,
    (isReady) => {
      if (!isReady) return
      if (typeof window === 'undefined') return
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (reduced) {
        display.value = target
        return
      }
      const start = performance.now()
      display.value = 0
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        // easeOutCubic — same family as the row-reveal settle curve so
        // the page motion language stays coherent.
        const eased = 1 - Math.pow(1 - t, 3)
        display.value = Math.round(target * eased * factor) / factor
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    },
    { immediate: true },
  )

  return display
}
