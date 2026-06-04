<script setup lang="ts">
/**
 * Top bar: sidebar toggle + breadcrumb + global command palette +
 * exceptions bell + user menu (with persona switcher).
 */
import { Bell, Settings, LogOut, Monitor, Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Persona } from '~/composables/usePersona'
import { PERSONA_LABELS } from '~/composables/usePersona'
import { SHIPMENTS, isException } from '~/mocks/shipments'
import { navForPersona } from '~/lib/nav'
import type { CommandPaletteGroup, CommandPaletteItem } from '~/components/blocks/CommandPalette.vue'

const { current: persona, set: setPersona } = usePersona()
const { theme, setTheme } = useTheme()

const cycleTheme = () => {
  const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
  const next = order[(order.indexOf(theme.value) + 1) % order.length]
  setTheme(next)
}

// Open exceptions (delays + holds) drive the bell badge.
const exceptionCount = computed(() => SHIPMENTS.filter(isException).length)

// Cmd-K palette groups: persona-filtered nav tree → CommandPalette shape.
const paletteGroups = computed<CommandPaletteGroup[]>(() =>
  navForPersona(persona.value).map((section) => ({
    heading: section.label,
    items: section.items
      .filter((i) => i.to)
      .map((i): CommandPaletteItem => ({
        label: i.label,
        hint: i.to,
        onSelect: () => navigateTo(i.to!),
      })),
  })),
)
</script>

<template>
  <header class="bg-background/95 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <SidebarTrigger class="size-9 shrink-0" />

    <div class="flex-1 min-w-0">
      <AppBreadcrumb />
    </div>

    <CommandPalette :groups="paletteGroups" trigger-label="Search…" placeholder="Jump to…" />

    <!-- Exceptions bell with count badge. Routes to the filtered ledger. -->
    <div class="relative">
      <Button variant="ghost" size="icon" class="size-9" as-child>
        <NuxtLink to="/shipments?status=exception" aria-label="Open exceptions">
          <Bell class="size-4" />
        </NuxtLink>
      </Button>
      <span
        v-if="exceptionCount > 0"
        class="bg-destructive text-destructive-foreground pointer-events-none absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums ring-2 ring-background"
      >
        {{ exceptionCount > 9 ? '9+' : exceptionCount }}
      </span>
    </div>

    <!-- Theme toggle: cycles light → dark → system -->
    <Button
      variant="ghost"
      size="icon"
      class="size-9"
      :aria-label="`Theme: ${theme}`"
      @click="cycleTheme()"
    >
      <Sun v-if="theme === 'light'" class="size-4" />
      <Moon v-else-if="theme === 'dark'" class="size-4" />
      <Monitor v-else class="size-4" />
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon" class="size-9 rounded-full" aria-label="User menu">
          <Avatar class="size-8 ring-1 ring-border">
            <AvatarFallback class="text-xs font-semibold">AQ</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-60">
        <DropdownMenuLabel class="font-normal">
          <div class="flex items-center gap-2.5">
            <Avatar class="size-9">
              <AvatarFallback class="text-xs font-semibold">AQ</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">Avery Quinn</p>
              <p class="text-muted-foreground truncate text-xs">avery.quinn@shiptrack.dev</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel class="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          View as
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          :model-value="persona"
          @update:model-value="(v) => setPersona(v as Persona)"
        >
          <DropdownMenuRadioItem
            v-for="key in (['admin', 'dispatcher', 'customer'] as Persona[])"
            :key="key"
            :value="key"
          >
            {{ PERSONA_LABELS[key] }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem as-child>
          <NuxtLink to="/settings" class="flex items-center gap-2 cursor-pointer">
            <Settings class="size-3.5" />Settings
          </NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled class="flex items-center gap-2">
          <LogOut class="size-3.5" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
