<script setup lang="ts">
/**
 * App sidebar — persona-aware nav rail.
 *
 * Workspace pill header, grouped nav sections with labels + count badges,
 * and a collapse trigger. Search, user profile, theme, and notifications
 * live in the topbar (single source).
 */
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'
import { Truck } from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { navForPersona } from '~/lib/nav'
import { LIVE_TRIPS } from '~/mocks/live'
import { SHIPMENTS, isException } from '~/mocks/shipments'

const { current: persona } = usePersona()
const route = useRoute()

const sections = computed(() => navForPersona(persona.value))

// Active row = the longest nav `to` that the current path equals or sits under,
// so detail routes (/shipments/SHP-1024) light the parent ("Shipments") while a
// more specific sibling (/shipments/new) still wins on its own route.
const activeTo = computed(() => {
  const path = route.path
  let best = ''
  for (const section of sections.value) {
    for (const item of section.items) {
      if (!item.to) continue
      if ((path === item.to || path.startsWith(`${item.to}/`)) && item.to.length > best.length) {
        best = item.to
      }
    }
  }
  return best
})

function iconFor(name?: string) {
  if (!name) return null
  return (icons as Record<string, any>)[name] ?? null
}

// Live count badges on nav rows — deterministic from the mock ledger, so
// server + client render identically (no hydration drift).
const NAV_BADGE: Record<string, number> = {
  '/live': LIVE_TRIPS.length,
  '/control-tower': SHIPMENTS.filter(isException).length,
}


</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child tooltip="ShipTrack" class="group-data-[collapsible=icon]:!justify-center">
            <NuxtLink to="/dashboard">
              <span
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl shadow-sm group-data-[collapsible=icon]:size-6"
              >
                <Truck class="size-4 group-data-[collapsible=icon]:size-3.5" />
              </span>
              <div class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span class="font-display truncate font-semibold tracking-tight">ShipTrack</span>
                <span class="text-muted-foreground truncate text-xs tracking-wide">Logistics workspace</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

    </SidebarHeader>

    <SidebarContent class="gap-1">
      <SidebarGroup v-for="section in sections" :key="section.label" class="py-1">
        <SidebarGroupLabel
          class="text-muted-foreground/70 px-2 text-xs font-semibold uppercase tracking-widest"
        >
          {{ section.label }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in section.items" :key="item.to">
              <SidebarMenuButton
                :is-active="item.to === activeTo"
                as-child
                :tooltip="item.label"
                class="data-[active=true]:!bg-sidebar-accent data-[active=true]:!text-sidebar-accent-foreground data-[active=true]:font-medium"
              >
                <NuxtLink :to="item.to" :aria-current="item.to === activeTo ? 'page' : undefined">
                  <component :is="iconFor(item.icon)" v-if="iconFor(item.icon)" class="size-4 shrink-0" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
              <SidebarMenuBadge v-if="item.to && NAV_BADGE[item.to]" class="bg-primary/12 text-primary">
                {{ NAV_BADGE[item.to] }}
              </SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="pb-2" />

    <SidebarRail />
  </Sidebar>
</template>
