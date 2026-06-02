<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { chipVariants } from './chip.variants'

// Inlined unions: SFC compiler can't extract runtime props from
// `ChipVariants['variant'] | ['size']`.
const props = defineProps<{
  variant?: 'default' | 'filled' | 'outlined' | 'elevated' | 'success' | 'warning' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  class?: HTMLAttributes['class']
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <span :class="cn(chipVariants({ variant, size }), props.class)">
    <slot />
    <button
      v-if="closable"
      type="button"
      class="focus-visible:ring-ring ml-0.5 rounded-full hover:bg-black/10 focus-visible:ring-1 focus-visible:outline-none"
      @click.stop="emit('close')"
    >
      <X class="size-3" />
      <span class="sr-only">Remove</span>
    </button>
  </span>
</template>
