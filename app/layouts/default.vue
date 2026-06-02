<script setup lang="ts">
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import Sidebar02 from '~/components/blocks/sidebar-02/Sidebar02.vue'
</script>

<template>
  <SidebarProvider>
    <Sidebar02 />
    <SidebarInset>
      <AppTopbar />
      <div class="min-h-[calc(100svh-3.5rem)]">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
