/**
 * Route-level guard: dispatcher-or-above. Admins pass through.
 *
 * Client-only -- persona state lives in localStorage, which SSR can't
 * read, so the redirect fires after hydration. Pages that need the gate
 * add `definePageMeta({ middleware: 'require-dispatcher' })`.
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const { isDispatcher } = usePersona()
  if (!isDispatcher.value) {
    return navigateTo('/403')
  }
})
