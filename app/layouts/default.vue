<script setup lang="ts">
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import Sidebar07 from '~/components/blocks/sidebar-07/Sidebar07.vue'
</script>

<template>
  <SidebarProvider>
    <a
      href="#main"
      class="focus-visible:ring-ring sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-3 focus-visible:z-50 focus-visible:not-sr-only focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:shadow focus-visible:ring-2"
    >
      Skip to content
    </a>
    <Sidebar07 />
    <SidebarInset>
      <AppTopbar />
      <main id="main" tabindex="-1" class="min-h-[calc(100svh-3.5rem)] outline-none">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
