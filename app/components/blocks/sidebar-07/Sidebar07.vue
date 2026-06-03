<script setup lang="ts">
/**
 * App sidebar — sidebar-07 block from the uipkge registry, adapted to this
 * template's persona-aware nav.
 *
 * Kept from the registry: the workspace pill header, the ⌘K search affordance,
 * grouped nav sections with labels + count badges, and the signature "bottom
 * action bar" (user pill above an icon toolbar). Replaced: the demo workspace →
 * the ShipTrack brand; the hard-coded Dashboard/Management/Content groups →
 * `navForPersona(persona)` so the sidebar reflows when the topbar persona
 * switcher fires; the static user pill → the functional `NavUser` dropdown.
 *
 * Every toolbar button is wired to a real action (no dead affordances):
 * Settings → /settings, bell → exceptions ledger, ⌘ → command palette,
 * Sun/Moon → theme, and the trailing SidebarTrigger collapses the rail.
 */
import { computed, ref, onMounted } from 'vue'
import * as icons from 'lucide-vue-next'
import { Truck, Search, Settings as SettingsIcon, Bell, Command, Moon, Sun } from 'lucide-vue-next'
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
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import NavUser from '../sidebar-02/NavUser.vue'
import { navForPersona } from '~/lib/nav'
import { resolvedTrips } from '~/mocks/live'
import { SHIPMENTS, isException } from '~/mocks/shipments'

const { current: persona } = usePersona()
const { theme, setTheme } = useTheme()
const route = useRoute()

const sections = computed(() => navForPersona(persona.value))

function iconFor(name?: string) {
  if (!name) return null
  return (icons as Record<string, any>)[name] ?? null
}

// Live count badges on nav rows — deterministic from the mock ledger, so
// server + client render identically (no hydration drift).
const activeTrips = resolvedTrips().length
const exceptionCount = computed(() => SHIPMENTS.filter(isException).length)
const NAV_BADGE: Record<string, number> = { '/live': activeTrips }

// SSR-safe dark detection: `mounted` is false during SSR + the first client
// render, so the Sun/Moon icon matches on both sides; it flips post-hydration.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const isDark = computed(
  () =>
    mounted.value &&
    (theme.value === 'dark' || (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)),
)

const openPalette = () => useCommandPalette().show()

// Canonical "me" for the demo — one source so every persona renders the same
// avatar without forking SSR/client.
const ME = { name: 'Avery Quinn', email: 'avery.quinn@shiptrack.dev' }
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

      <!-- ⌘K search — opens the shared command palette (same target as the
           topbar search + the global "/" shortcut). -->
      <div class="px-1 pt-1 group-data-[collapsible=icon]:hidden">
        <button
          type="button"
          class="border-input bg-background text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex h-9 w-full items-center gap-2 rounded-md border px-2.5 text-sm transition-colors"
          @click="openPalette"
        >
          <Search class="size-3.5 shrink-0" />
          <span class="flex-1 text-left">Search…</span>
          <kbd
            class="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border px-1 font-mono text-[10px] font-medium select-none"
          >
            <span class="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>
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

    <SidebarFooter>
      <NavUser :user="ME" />

      <!-- Signature "bottom action bar" — every icon is wired. Toggled by CSS
           (not a JS state branch) so the SSR + client DOM are identical: the
           full toolbar hides when the rail collapses to icons, and the lone
           trigger surfaces in its place. -->
      <SidebarSeparator class="my-1 group-data-[collapsible=icon]:hidden" />
      <div class="flex items-center justify-between px-1 pb-1 group-data-[collapsible=icon]:hidden">
        <NuxtLink
          to="/settings"
          aria-label="Settings"
          class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex aspect-square size-8 items-center justify-center rounded-md transition-colors"
        >
          <SettingsIcon class="size-4" />
        </NuxtLink>
        <NuxtLink
          to="/shipments?status=exception"
          aria-label="Exceptions"
          class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground relative flex aspect-square size-8 items-center justify-center rounded-md transition-colors"
        >
          <Bell class="size-4" />
          <span
            v-if="exceptionCount > 0"
            class="bg-destructive text-destructive-foreground ring-sidebar pointer-events-none absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ring-2"
          >
            {{ exceptionCount > 9 ? '9+' : exceptionCount }}
          </span>
        </NuxtLink>
        <button
          type="button"
          aria-label="Command palette"
          class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex aspect-square size-8 items-center justify-center rounded-md transition-colors"
          @click="openPalette"
        >
          <Command class="size-4" />
        </button>
        <button
          type="button"
          :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
          class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex aspect-square size-8 items-center justify-center rounded-md transition-colors"
          @click="setTheme(isDark ? 'light' : 'dark')"
        >
          <Sun v-if="isDark" class="size-4" />
          <Moon v-else class="size-4" />
        </button>
        <SidebarTrigger class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground size-8 rounded-md" />
      </div>
      <div class="hidden items-center justify-center pb-1 group-data-[collapsible=icon]:flex">
        <SidebarTrigger class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground size-8 rounded-md" />
      </div>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
