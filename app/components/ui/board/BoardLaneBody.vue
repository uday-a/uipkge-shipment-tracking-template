<script setup lang="ts">
import { inject } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { BOARD_CONTEXT } from './context'

interface Props {
  class?: HTMLAttributes['class']
  /** Override the TransitionGroup name. Defaults to the board-level motion preset. */
  motion?: string
}

const props = defineProps<Props>()

const board = inject(BOARD_CONTEXT, null)
const motionName = () => props.motion ?? board?.motion.value ?? 'motion-list'
</script>

<template>
  <!-- Inner padding (py-1 / px-0.5) reserves breathing room for the
       per-card hover-lift (-translate-y-0.5), the focus / drag / moved
       rings (ring-2 + ring-offset-1 ≈ 3px outward), and the hover
       shadow halo. Without it, the first / last cards' hover state
       crops against the overflow-y-auto edge. pr-1 still wins on the
       right so the thin scrollbar has a gutter. -->
  <div
    data-uipkge
    data-slot="board-lane-body"
    :class="
      cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-0.5 py-1 pr-1 [scrollbar-width:thin]',
        props.class
      )
    "
  >
    <!-- ClientOnly: Vue 3 TransitionGroup emits Fragment vnodes on the
         server and proper DOM elements on the client, which trips a
         hydration mismatch on every card slot. Render a plain div on
         SSR (same shape, no animations — which the client can't see
         pre-hydration anyway) and swap to TransitionGroup on mount. -->
    <ClientOnly>
      <TransitionGroup :name="motionName()" tag="div" class="relative flex flex-col gap-2">
        <slot />
      </TransitionGroup>
      <template #fallback>
        <div class="relative flex flex-col gap-2">
          <slot />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
