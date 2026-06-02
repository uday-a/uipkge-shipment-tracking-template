<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <h3 data-uipkge data-slot="timeline-title" :class="cn('text-sm leading-none font-semibold tracking-tight', props.class)" v-bind="$attrs">
    <slot />
  </h3>
</template>
