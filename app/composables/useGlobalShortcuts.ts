import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Global keyboard shortcut handler.
 *
 * Added in iter-23 to close the carry-over open since iter-21: the
 * `?` keyboard-shortcut popover (iter-21) ships a teach-card listing
 * `g d` / `g p` / `g t` / `g r` / `/` chords, but only `?` itself was
 * wired. Teach-but-don't-deliver is worse than not teaching — the user
 * presses `g d` after reading the card and nothing happens. This
 * composable closes the loop.
 *
 * Bindings:
 *   - `g` then `<letter>` within `chordTimeout`ms → navigate (Vim-style)
 *       g d → /dashboard
 *       g s → /shipments
 *       g t → /tracking
 *       g f → /fleet
 *       g r → /routes
 *       g c → /customers
 *       g a → /analytics
 *       g e → /settings
 *   - `/` → focus the global search (CommandPalette in the topbar)
 *
 * Options (iter-24): `chordTimeout` defaults to 1000ms (Vim convention).
 * Surfaced as a named knob so a 2nd consumer can tune it (e.g. fast
 * typists at 700ms, accessibility-first surfaces at 1500ms) without
 * editing the composable body. The iter-23 carry-over called this out
 * once a 2nd consumer landed — proactively exposing the option keeps
 * the design language tunable as the chord vocabulary grows.
 *
 * Guards:
 *   - Skips when the focused element is INPUT/TEXTAREA/SELECT or
 *     contenteditable so the shortcuts don't hijack form typing.
 *   - Skips when modifier keys (Cmd/Ctrl/Alt/Meta) are held so we
 *     don't collide with Cmd+R (browser reload), Ctrl+P (print), etc.
 *
 * SSR-safe: window listener attached in onMounted only.
 */

type Chord = 'g d' | 'g s' | 'g t' | 'g f' | 'g r' | 'g c' | 'g a' | 'g e' | '/'

const ROUTE_BY_CHORD: Partial<Record<Chord, string>> = {
  'g d': '/dashboard',
  'g s': '/shipments',
  'g t': '/tracking',
  'g f': '/fleet',
  'g r': '/routes',
  'g c': '/customers',
  'g a': '/analytics',
  'g e': '/settings',
}

export interface UseGlobalShortcutsOptions {
  /**
   * Milliseconds to wait for the second key of a `g`-prefix chord
   * before discarding the prefix. Default 1000 (Vim convention).
   */
  chordTimeout?: number
}

export function useGlobalShortcuts(options: UseGlobalShortcutsOptions = {}) {
  const chordTimeout = options.chordTimeout ?? 1000

  let gPrefixActive = false
  let gPrefixTimer: ReturnType<typeof setTimeout> | null = null

  function clearPrefix() {
    gPrefixActive = false
    if (gPrefixTimer) {
      clearTimeout(gPrefixTimer)
      gPrefixTimer = null
    }
  }

  function shouldIgnoreEvent(e: KeyboardEvent): boolean {
    // Don't hijack browser/OS chords.
    if (e.metaKey || e.ctrlKey || e.altKey) return true
    const t = e.target as HTMLElement | null
    if (!t) return false
    const tag = t.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (t.isContentEditable) return true
    return false
  }

  function focusGlobalSearch() {
    // Iter-25 (closes iter-23/24 carry-over): open the palette via the
    // shared `useCommandPalette()` ref instead of dispatching a
    // synthetic ⌘K keydown. The synthetic-event path coupled this
    // composable to whichever chord CommandPalette happened to listen
    // for — if the palette ever changes its trigger from ⌘K to ⌘J,
    // the `/` shortcut breaks silently. The direct channel kills that
    // coupling: both files now read/write the same module-scoped ref.
    if (typeof window === 'undefined') return
    useCommandPalette().show()
  }

  function onKeydown(e: KeyboardEvent) {
    if (shouldIgnoreEvent(e)) {
      clearPrefix()
      return
    }

    // `/` opens command palette (focus search). Doesn't combine with
    // the `g`-prefix state machine.
    if (e.key === '/' && !gPrefixActive) {
      e.preventDefault()
      focusGlobalSearch()
      return
    }

    // `g` arms the chord prefix; second key within `chordTimeout`ms resolves.
    if (e.key === 'g' && !gPrefixActive) {
      gPrefixActive = true
      gPrefixTimer = setTimeout(clearPrefix, chordTimeout)
      return
    }

    if (gPrefixActive) {
      const chord = `g ${e.key}` as Chord
      const route = ROUTE_BY_CHORD[chord]
      clearPrefix()
      if (route) {
        e.preventDefault()
        navigateTo(route)
      }
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('keydown', onKeydown)
  })
  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('keydown', onKeydown)
    clearPrefix()
  })
}
