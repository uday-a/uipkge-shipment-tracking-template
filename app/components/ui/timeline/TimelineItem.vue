<script setup lang="ts">
import { computed, inject, onBeforeUnmount, provide, toRef } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import {
  TIMELINE_CONTEXT,
  TIMELINE_ITEM_CONTEXT,
  type TimelineSide,
  type TimelineStatus,
} from './context'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    side?: TimelineSide
    status?: TimelineStatus
  }>(),
  {
    status: 'default',
  }
)

const ctx = inject(TIMELINE_CONTEXT, null)
const id = Symbol('TimelineItem')

if (ctx) {
  ctx.register(id)
  onBeforeUnmount(() => ctx.unregister(id))
}

const index = computed(() => (ctx ? ctx.itemIds.value.indexOf(id) : 0))
const isFirst = computed(() => index.value === 0)
const isLast = computed(() =>
  ctx ? index.value === ctx.itemIds.value.length - 1 : false
)

const effectiveSide = computed<TimelineSide>(() => {
  if (props.side) return props.side
  if (!ctx) return 'left'
  if (ctx.align.value === 'center') {
    if (ctx.direction.value === 'vertical') {
      return index.value % 2 === 0 ? 'left' : 'right'
    }
    return index.value % 2 === 0 ? 'top' : 'bottom'
  }
  return ctx.side.value
})

const direction = computed(() => ctx?.direction.value ?? 'vertical')
const density = computed(() => ctx?.density.value ?? 'default')
const isCenter = computed(() => ctx?.align.value === 'center')

const verticalSpacing = computed(() => {
  if (isLast.value) return ''
  return {
    compact: '[&>[data-slot=timeline-content]]:pb-2',
    default: '[&>[data-slot=timeline-content]]:pb-6',
    comfortable: '[&>[data-slot=timeline-content]]:pb-10',
  }[density.value]
})

const horizontalSpacing = computed(() => {
  if (isLast.value) return ''
  return {
    compact: '[&>[data-slot=timeline-content]]:pr-3',
    default: '[&>[data-slot=timeline-content]]:pr-6',
    comfortable: '[&>[data-slot=timeline-content]]:pr-10',
  }[density.value]
})

provide(TIMELINE_ITEM_CONTEXT, {
  index,
  isFirst,
  isLast,
  side: effectiveSide,
  status: toRef(props, 'status'),
  direction,
  density,
})
</script>

<template>
  <div
    data-uipkge
    data-slot="timeline-item"
    :data-side="effectiveSide"
    :data-last="isLast || undefined"
    :class="
      cn(
        'relative',
        // start mode (default): simple flex
        // No item padding — TimelineMedia's continuous line relies on items
        // butting up edge-to-edge. Use TimelineContent's own padding for
        // breathing room between rows/cards.
        !isCenter && direction === 'vertical' && [
          'flex gap-4',
          effectiveSide === 'right' && 'flex-row-reverse text-right',
          verticalSpacing,
        ],
        !isCenter && direction === 'horizontal' && [
          'flex flex-col gap-2',
          effectiveSide === 'bottom' && 'flex-col-reverse',
          horizontalSpacing,
        ],
        // center alternating: 3-col / 3-row grid
        isCenter && direction === 'vertical' && [
          'grid grid-cols-[1fr_auto_1fr] items-start gap-x-4',
          '[&>[data-slot=timeline-media]]:col-start-2',
          '[&>[data-slot=timeline-separator]]:col-start-2',
          effectiveSide === 'left' && '[&>[data-slot=timeline-content]]:col-start-1 [&>[data-slot=timeline-content]]:text-right',
          effectiveSide === 'right' && '[&>[data-slot=timeline-content]]:col-start-3',
          verticalSpacing,
        ],
        isCenter && direction === 'horizontal' && [
          'grid grid-rows-[1fr_auto_1fr] items-start gap-y-2',
          '[&>[data-slot=timeline-media]]:row-start-2',
          '[&>[data-slot=timeline-separator]]:row-start-2',
          effectiveSide === 'top' && '[&>[data-slot=timeline-content]]:row-start-1 [&>[data-slot=timeline-content]]:self-end',
          effectiveSide === 'bottom' && '[&>[data-slot=timeline-content]]:row-start-3',
          horizontalSpacing,
        ],
        props.class
      )
    "
    v-bind="$attrs"
  >
    <slot
      :index="index"
      :is-last="isLast"
      :side="effectiveSide"
      :status="status"
    />
  </div>
</template>
