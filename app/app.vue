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
