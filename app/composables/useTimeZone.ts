import { computed, ref } from 'vue'

/**
 * Settings-driven primary timezone.
 *
 * Iter-25 added the cosmetic seam: a module-scoped `label` ref so the
 * header date-badge formatter and the activity-feed "All times shown in
 * …" footer pulled the suffix from one source. That closed the
 * STRING-DEDUPE half of the carry-over, but iter-25 explicitly flagged
 * the IANA math half as deferred ("useTimeZone() exposes label only
 * (cosmetic suffix). Real multi-zone math (DST, IANA Intl.DateTimeFormat)
 * would need a sibling composable that consumes the IANA zone string and
 * re-formats `now.value` through it"). Iter-26 closes that loop here.
 *
 * Before iter-26, the dashboard header rendered `04:18 PT` using
 * `now.getHours()` (browser-LOCAL time) with a static `PT` suffix — so a
 * viewer in Berlin or Tokyo would see their wall clock dressed up as
 * Pacific time. The number and the label disagreed, silently. Verified
 * live via Playwright: the browser TZ `Asia/Kuala_Lumpur` produced a
 * badge reading `04:28 PT` when actual Pacific was the prior evening.
 *
 * The new `format(date)` helper runs the Date through
 * `Intl.DateTimeFormat` with the IANA zone (defaults to
 * `'America/Los_Angeles'` to match the `'PT'` label) so the parts
 * returned (hour, minute, weekday, month, day) are always anchored to
 * the configured zone regardless of the viewer's browser locale. DST
 * transitions are handled automatically by `Intl.DateTimeFormat`.
 *
 * SSR-safe: `Intl.DateTimeFormat` is part of the JS standard library and
 * available in Node 14+ (Nuxt's SSR runtime). No DOM access. The default
 * `'America/Los_Angeles'` zone is fully supported in the ICU tz database
 * shipped with Node.
 *
 * Backward compatible: existing consumers binding to `label` (iter-25)
 * continue to read the same string. The new `format()` helper is purely
 * additive; tightly-coupled call sites can adopt it lazily.
 */

type Parts = {
  weekday: string // 'Mon' | 'Tue' | ...
  month: string // 'Jan' | 'Feb' | ...
  day: number // 1..31
  hour: number // 0..23
  minute: number // 0..59
  dow: number // 0=Sun … 6=Sat (zone-anchored)
  year: number
}

const label = ref<string>('PT')
const iana = ref<string>('America/Los_Angeles')

// Memoise the formatter per IANA zone — `Intl.DateTimeFormat`
// construction is non-trivial on hot paths (header ticks every 60s and
// every reactive read inside the computed re-runs `format()`). One
// formatter per zone is created lazily and reused.
const formatterCache = new Map<string, Intl.DateTimeFormat>()
function getFormatter(zone: string): Intl.DateTimeFormat {
  let fmt = formatterCache.get(zone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      year: 'numeric',
    })
    formatterCache.set(zone, fmt)
  }
  return fmt
}

// Map English short-day strings produced by `Intl.DateTimeFormat` back
// to numeric day-of-week (0=Sun … 6=Sat). The dashboard's work-week
// strip computed (`workWeekIndex`) needs the numeric form, but the
// formatter only emits 'Mon'/'Tue'/... — this is the inverse lookup.
const DOW_BY_SHORT: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

export function useTimeZone() {
  return {
    /** Reactive zone LABEL (cosmetic suffix — e.g. 'PT', 'ET', 'UTC'). */
    label,
    /** Reactive IANA zone string (math operand — e.g. 'America/Los_Angeles'). */
    iana,
    /** Replace BOTH the label and (optionally) the IANA zone in one call. */
    set(next: string, ianaNext?: string) {
      label.value = next
      if (ianaNext) iana.value = ianaNext
    },
    /**
     * Project a Date instance into the configured IANA zone and return
     * named parts (hour, minute, weekday, month, day, dow, year).
     *
     * Replaces `date.getHours()` / `.getDay()` / etc. which read the
     * browser's local zone. Use this anywhere the rendered string must
     * match the `label` suffix to avoid a number-label disagreement.
     */
    format(date: Date): Parts {
      const parts = getFormatter(iana.value).formatToParts(date)
      const byType: Record<string, string> = {}
      for (const p of parts) if (p.type !== 'literal') byType[p.type] = p.value
      return {
        weekday: byType.weekday ?? 'Mon',
        month: byType.month ?? 'Jan',
        day: Number(byType.day ?? 1),
        hour: Number(byType.hour ?? 0),
        minute: Number(byType.minute ?? 0),
        dow: DOW_BY_SHORT[byType.weekday ?? 'Mon'] ?? 1,
        year: Number(byType.year ?? new Date().getUTCFullYear()),
      }
    },
  }
}

/**
 * Convenience reactive computed: feed a reactive `Date` ref and get back
 * a reactive `Parts` projection through the current IANA zone. Avoids
 * boilerplate when a consumer wants zone-anchored time in a template.
 */
export function useZonedParts(dateRef: { value: Date }) {
  const { format } = useTimeZone()
  return computed(() => format(dateRef.value))
}
