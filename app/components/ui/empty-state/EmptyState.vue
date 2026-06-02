<script setup lang="ts">
import type { Component } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  icon?: Component
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <div :class="cn('flex flex-col items-center py-12 text-center', props.class)">
    <component :is="icon" v-if="icon" class="text-muted-foreground mx-auto mb-3 size-10" />
    <h3 v-if="title" class="text-foreground font-medium">{{ title }}</h3>
    <p v-if="description" class="text-muted-foreground mt-1 max-w-sm text-sm">{{ description }}</p>
    <slot />
  </div>
</template>
