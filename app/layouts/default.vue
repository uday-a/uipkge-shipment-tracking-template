<script setup lang="ts">
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import Sidebar07 from '~/components/blocks/sidebar-07/Sidebar07.vue'
</script>

<template>
  <SidebarProvider>
    <Sidebar07 />
    <SidebarInset>
      <AppTopbar />
      <div class="min-h-[calc(100svh-3.5rem)]">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
