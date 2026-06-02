<script setup lang="ts">
/**
 * One-stop "this page hasn't been built yet" surface.
 *
 * Every MVP route bootstraps via this; pages get rewritten one by one
 * as Phase 1 progresses. When all 15 stop using PlaceholderPage, the
 * MVP is done.
 */
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import * as icons from 'lucide-vue-next'

const props = defineProps<{
  title: string
  description?: string
  icon?: string
}>()

const iconComp = computed(() => {
  if (!props.icon) return icons.Hammer
  return (icons as Record<string, any>)[props.icon] ?? icons.Hammer
})
</script>

<template>
  <div class="mx-auto flex min-h-[60svh] max-w-2xl items-center justify-center p-6">
    <EmptyState
      :icon="iconComp"
      :title="title"
      :description="description ?? 'Coming in Phase 1 of the v2 build. The plan lives in docs/template-design.md.'"
    >
      <div class="mt-4">
        <Button variant="outline" as-child>
          <NuxtLink to="/dashboard">Back to dashboard</NuxtLink>
        </Button>
      </div>
    </EmptyState>
  </div>
</template>
