<script setup lang="ts">
import { computed, inject } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { TIMELINE_ITEM_CONTEXT, type TimelineStatus } from './context'
import { timelineMediaVariants, type TimelineMediaVariant } from './timeline.variants'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    variant?: TimelineMediaVariant
    status?: TimelineStatus
    /** Manually hide the auto-generated connector line. */
    hideConnector?: boolean
    /**
     * Color the connector line below the marker using the item's status
     * (success → green, muted → gray, etc) instead of the neutral border.
     * Opt-in so existing timelines stay visually unchanged.
     */
    coloredConnector?: boolean
  }>(),
  {
    variant: 'dot',
  }
)

const item = inject(TIMELINE_ITEM_CONTEXT, null)

const direction = computed(() => item?.direction.value ?? 'vertical')
const isFirst = computed(() => item?.isFirst.value ?? true)
const isLast = computed(() => item?.isLast.value ?? true)
const effectiveStatus = computed<TimelineStatus>(
  () => props.status ?? item?.status.value ?? 'default'
)
const showConnector = computed(() => !props.hideConnector && !isLast.value)

// Marker half-size in rem, used to crop the line so it visually emerges
// from the marker center on the first item.
const markerHalfRem = computed(
  () =>
    ({
      dot: '0.375rem', // size-3 = 12px / 2
      icon: '1rem', // size-8 = 32px / 2
      avatar: '1.125rem', // size-9 = 36px / 2
    })[(props.variant ?? 'dot') as 'dot' | 'icon' | 'avatar']
)

const connectorBgClass = computed(() => {
  if (!props.coloredConnector) return 'bg-border'
  return {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive',
    info: 'bg-info',
    muted: 'bg-muted-foreground/40',
  }[effectiveStatus.value]
})
</script>

<template>
  <div
    data-uipkge
    data-slot="timeline-media"
    :class="
      cn(
        'relative shrink-0 self-stretch',
        direction === 'vertical'
          ? 'flex w-9 flex-col items-center'
          : 'flex h-9 flex-row items-center',
        props.class
      )
    "
    :style="{ '--timeline-marker-half': markerHalfRem }"
  >
    <!-- Single continuous connector line, positioned through the marker.
         The marker's bg + ring-background acts as a "punch-through" so the
         line appears to break at each marker without any per-item math. -->
    <div
      v-if="showConnector"
      data-uipkge
      data-slot="timeline-media-connector"
      aria-hidden="true"
      :class="
        direction === 'vertical'
          ? cn(
              'absolute left-1/2 w-px -translate-x-1/2',
              connectorBgClass,
              isFirst ? 'top-[var(--timeline-marker-half)]' : 'top-0',
              'bottom-0'
            )
          : cn(
              'absolute top-1/2 h-px -translate-y-1/2',
              connectorBgClass,
              isFirst ? 'left-[var(--timeline-marker-half)]' : 'left-0',
              'right-0'
            )
      "
    />

    <!-- Marker — its bg + ring-background hides the line behind it. -->
    <div
      data-uipkge
      data-slot="timeline-media-marker"
      :class="
        cn(timelineMediaVariants({ variant, status: effectiveStatus }), 'relative z-10')
      "
    >
      <slot />
    </div>
  </div>
</template>
