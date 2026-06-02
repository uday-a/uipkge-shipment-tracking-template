/**
 * Route-level guard: admin-only.
 *
 * Client-only -- persona state lives in localStorage, which SSR can't
 * read, so the redirect fires after hydration. Pages that need the gate
 * add `definePageMeta({ middleware: 'require-admin' })`.
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const { isAdmin } = usePersona()
  if (!isAdmin.value) {
    return navigateTo('/403')
  }
})
