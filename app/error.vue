<script setup lang="ts">
/**
 * Global error surface. Nuxt mounts this for any uncaught error +
 * 404s. Three shapes are differentiated by status code:
 *   - 404 -> "we can't find that page"
 *   - 403 -> access denied (rare from here -- the route guard usually
 *            sends users to /403 directly)
 *   - 5xx -> something went wrong, with an optional stack toggle for
 *            developers reading the demo
 *
 * The "Show technical details" toggle is mock-friendly: stack traces
 * only render in dev (Nuxt strips them in production builds anyway),
 * but the affordance is there so the surface looks complete.
 */
import { computed, ref } from 'vue'
import { ArrowLeft, Home, SearchX, ShieldOff, TriangleAlert } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

const props = defineProps<{
  error: { statusCode: number; statusMessage?: string; message?: string; stack?: string }
}>()

const status = computed(() => props.error.statusCode ?? 500)
const isNotFound = computed(() => status.value === 404)
const isForbidden = computed(() => status.value === 403)

const icon = computed(() => {
  if (isNotFound.value) return SearchX
  if (isForbidden.value) return ShieldOff
  return TriangleAlert
})

const title = computed(() => {
  if (isNotFound.value) return "We can't find that page"
  if (isForbidden.value) return 'Access denied'
  return `${status.value} — something went wrong`
})

const description = computed(() => {
  if (isNotFound.value) {
    return "The page you were looking for moved, doesn't exist yet, or was archived."
  }
  if (isForbidden.value) {
    return 'Switch personas via the avatar menu to see this page.'
  }
  return props.error.message || props.error.statusMessage || 'An unexpected error occurred.'
})

useHead({ title: `${status.value} · ShipTrack` })
definePageMeta({ layout: false })

// Server-side errors arrive with a stack; client-side hydration errors
// usually don't. Hide the toggle when there's nothing useful behind it.
const showDetails = ref(false)
const hasStack = computed(() => Boolean(props.error.stack))

function backToDashboard() {
  // clearError() unmounts this error.vue and restores the matched route
  // tree. The redirect option also handles the case where the error
  // happened on a route we can't recover (e.g. a missing layout file).
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="bg-muted/40 grid min-h-screen place-items-center p-6">
    <div class="w-full max-w-xl space-y-8 text-center">
      <!-- Big status number sets the page apart from inline empty-states.
           tabular-nums keeps 404/500/etc. visually aligned at this scale. -->
      <p class="text-muted-foreground/40 text-7xl font-bold tabular-nums leading-none sm:text-8xl">
        {{ status }}
      </p>

      <EmptyState :icon="icon" :title="title" :description="description">
        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button @click="backToDashboard">
            <ArrowLeft class="mr-2 size-4" />
            Back to dashboard
          </Button>
          <Button variant="ghost" as-child>
            <NuxtLink to="/">
              <Home class="mr-2 size-4" />
              Go home
            </NuxtLink>
          </Button>
        </div>
      </EmptyState>

      <!-- 5xx-only: peek at the stack. Useful for devs poking around the
           template and harmless in production (Nuxt redacts the stack). -->
      <div v-if="!isNotFound && !isForbidden && hasStack" class="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground text-xs"
          @click="showDetails = !showDetails"
        >
          {{ showDetails ? 'Hide technical details' : 'Show technical details' }}
        </Button>
        <pre
          v-if="showDetails"
          class="bg-muted/50 max-h-64 overflow-auto rounded-lg border p-4 text-left font-mono text-xs leading-relaxed text-muted-foreground"
        >{{ error.stack }}</pre>
      </div>
    </div>
  </div>
</template>
