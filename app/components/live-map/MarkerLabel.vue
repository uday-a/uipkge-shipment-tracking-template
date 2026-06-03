<script setup lang="ts">
/** The label pill above a map marker (Current · / Origin · / via / Destination ·).
 *  Visual styles are the global .lm-* rules in app/assets/css/live-map.css —
 *  Mapbox relocates marker DOM out of the component subtree, so scoped styles
 *  wouldn't reach it. */
defineProps<{ variant?: 'default' | 'sm' }>()
</script>

<template>
  <span class="lm-label" :class="variant === 'sm' && 'lm-label-sm'"><slot /></span>
</template>
