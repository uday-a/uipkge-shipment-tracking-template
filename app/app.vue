<script setup lang="ts">
/**
 * Root app component.
 *
 * NuxtLayout wraps every route in `layouts/default.vue` (sidebar +
 * topbar + breadcrumb) unless the page opts out via
 * `definePageMeta({ layout: false })`. Without this wrapper Nuxt's
 * /layouts directory is never consulted.
 *
 * Toaster is mounted at the app root so vue-sonner's portal-less
 * toasts have a single canonical destination.
 */
import { Toaster } from '@/components/ui/sonner'

useHead({
  htmlAttrs: { lang: 'en' },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster />
</template>

<style>
/* Subtle route transition — a short fade + lift. Kept understated so it
   reads as polish, not motion for its own sake. */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
  .page-enter-from {
    transform: none;
  }
}
</style>
