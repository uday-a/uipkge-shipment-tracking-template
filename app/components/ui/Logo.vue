<script setup lang="ts">
/**
 * Zepp Ebikes brand mark — "ebike in motion" (logo-lab #11): a bicycle with a
 * lightning-bolt frame and trailing speed lines. One `currentColor` glyph so
 * it sits on the primary-tinted tile in the sidebar header + sign-in card and
 * scales from the collapsed rail up.
 */
const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
    aria-hidden="true"
  >
    <!-- Speed / motion lines -->
    <path d="M2 9 H8 M1 14 H6.5 M2.5 19 H7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    <!-- Wheels -->
    <circle cx="13" cy="22" r="4.8" stroke="currentColor" stroke-width="1.9" />
    <circle cx="25" cy="22" r="4.8" stroke="currentColor" stroke-width="1.9" />
    <!-- Stays + handlebar -->
    <path d="M13 22 L18.5 21 M25 22 L20.5 14.5 M19.5 11 H22.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Lightning-bolt frame -->
    <path d="M21 6.5 L15.5 16.5 H18.8 L17.4 23.5 L23 13.5 H19.6 Z" fill="currentColor" />
  </svg>
</template>
