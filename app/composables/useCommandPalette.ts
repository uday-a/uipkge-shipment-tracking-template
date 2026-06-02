import { ref } from 'vue'

/**
 * Shared command-palette open state.
 *
 * Added in iter-25 to close the iter-23/24 carry-over: the `/` keyboard
 * shortcut was opening the global command palette by dispatching a
 * synthetic `⌘K` keydown event so `CommandPalette.vue`'s own listener
 * would catch it. That worked, but it coupled the dashboard's `/`
 * semantics to whichever chord the palette happened to listen for — if
 * CommandPalette ever changes its trigger from `⌘K` to (say) `⌘J`, the
 * dashboard breaks silently with no compile-time signal.
 *
 * This composable replaces the synthetic-keydown channel with a direct
 * one: a module-scoped reactive ref that any consumer can flip. The
 * palette itself binds its `v-model:open` to this ref, and producers
 * (the `/` shortcut handler, any in-page "search" CTA, etc.) call the
 * exposed `show()` / `hide()` / `toggle()` helpers. Single source of
 * truth, no string-keyed coupling across files.
 *
 * The ref is module-scoped (declared once at file top, returned by
 * reference from `useCommandPalette()`) so all consumers share one
 * instance — typical "global app state" composable pattern. SSR-safe:
 * the ref is just a primitive `ref(false)`, no DOM access. The
 * CommandPalette component keeps its `⌘K` keydown listener for users
 * who hit ⌘K directly (no behaviour regression); the new channel only
 * replaces the cross-file dispatch path.
 */

const open = ref(false)

export function useCommandPalette() {
  return {
    /** Reactive open state. Bind to `v-model:open` on CommandPalette. */
    open,
    /** Open the palette. */
    show() {
      open.value = true
    },
    /** Close the palette. */
    hide() {
      open.value = false
    },
    /** Toggle the palette. */
    toggle() {
      open.value = !open.value
    },
  }
}
