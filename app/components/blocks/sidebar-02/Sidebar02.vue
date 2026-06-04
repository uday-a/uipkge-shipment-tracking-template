<script setup lang="ts">
/**
 * App sidebar — sidebar-02 block from the uipkge registry, adapted to
 * this template's persona-aware nav.
 *
 * Kept from the registry: `Sidebar collapsible="icon"` (icon-only collapse
 * with tooltips), the `NavUser` footer block, and `SidebarRail` (the
 * click-strip that toggles collapse). Replaced: the team switcher → the
 * ShipTrack brand mark, and the demo nav → SidebarGroups driven by
 * `navForPersona(persona)` so the sidebar reflows when the topbar persona
 * switcher fires.
 *
 * Active-state highlight uses the registry's `:is-active` pattern; the
 * left-edge accent bar comes from `data-[active=true]:before:*` utilities.
 * Each menu button gets `:tooltip=` so icon-collapsed users still see the
 * label.
 */
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'
import Logo from '@/components/ui/Logo.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import NavUser from './NavUser.vue'
import { navForPersona } from '~/lib/nav'

const { current: persona } = usePersona()
const route = useRoute()

const sections = computed(() => navForPersona(persona.value))

function iconFor(name?: string) {
  if (!name) return null
  return (icons as Record<string, any>)[name] ?? null
}

// Canonical "me" for the demo. Single source so every persona renders
// the same avatar without forking SSR/client.
const ME = {
  name: 'Avery Quinn',
  email: 'avery.quinn@shiptrack.dev',
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <NuxtLink to="/dashboard" class="flex items-center gap-2.5 px-2 py-1.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:size-9">
          <Logo class="size-5" />
        </span>
        <div class="flex flex-col min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
          <span class="font-semibold tracking-tight text-sm">ShipTrack</span>
          <span class="text-muted-foreground text-xs tracking-wide">Powered by uipkge</span>
        </div>
      </NuxtLink>
    </SidebarHeader>

    <!-- SidebarContent ships `overflow-auto` which paints a native
         scrollbar gutter when the nav list exceeds viewport height —
         on short windows that causes the sidebar to shift as items
         appear/disappear. Override to `overflow-visible` and let
         `OverlayScroll` (Slack-style hidden-native + auto-fading
         custom thumb) handle the scroll instead, matching the activity
         feed on the dashboard. -->
    <SidebarContent class="gap-1 overflow-visible group-data-[collapsible=icon]:overflow-hidden">
      <OverlayScroll class="flex-1 min-h-0">
      <SidebarGroup v-for="section in sections" :key="section.label" class="py-1">
        <SidebarGroupLabel class="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 px-2">
          {{ section.label }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in section.items" :key="item.to">
              <SidebarMenuButton
                :is-active="route.path === item.to"
                as-child
                :tooltip="item.label"
                class="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold data-[active=true]:shadow-sm"
              >
                <NuxtLink :to="item.to">
                  <component :is="iconFor(item.icon)" v-if="iconFor(item.icon)" class="size-4 shrink-0" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      </OverlayScroll>
    </SidebarContent>

    <SidebarFooter>
      <NavUser :user="ME" />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
