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
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { navForPersona } from '~/lib/nav'
import { LIVE_TRIPS } from '~/mocks/live'

const { current: persona } = usePersona()
const route = useRoute()

const sections = computed(() => navForPersona(persona.value))

function iconFor(name?: string) {
  if (!name) return null
  return (icons as Record<string, any>)[name] ?? null
}

// Live count badges on nav rows — deterministic from the mock ledger, so
// server + client render identically (no hydration drift).
const NAV_BADGE: Record<string, number> = { '/live': LIVE_TRIPS.length }


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
                :is-active="route.path === item.to"
                as-child
                :tooltip="item.label"
                class="data-[active=true]:!bg-sidebar-accent data-[active=true]:!text-sidebar-accent-foreground data-[active=true]:font-medium"
              >
                <NuxtLink :to="item.to">
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

    <SidebarFooter class="pb-2">
      <SidebarTrigger class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground mx-auto size-8 rounded-md" />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
