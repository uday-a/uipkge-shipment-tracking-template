import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted'

/** Map a semantic tone to a `<Badge variant>` (no native "muted" variant). */
export function toneBadge(tone: Tone): 'success' | 'warning' | 'destructive' | 'info' | 'secondary' {
  return tone === 'muted' ? 'secondary' : tone
}

/** Map a semantic tone to a foreground text colour class. */
export function toneText(tone: Tone): string {
  const map: Record<Tone, string> = {
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
    info: 'text-info',
    muted: 'text-muted-foreground',
  }
  return map[tone]
}

/** Map a semantic tone to a solid background dot colour class. */
export function toneDot(tone: Tone): string {
  const map: Record<Tone, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    info: 'bg-info',
    muted: 'bg-muted-foreground/50',
  }
  return map[tone]
}

/** "May 28, 2026" from an ISO yyyy-mm-dd slice. Locale-fixed for SSR. */
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function shortDate(iso?: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`
}

