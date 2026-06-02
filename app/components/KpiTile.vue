<script setup lang="ts">
/**
 * Metric card. Deliberately quiet: a label, a large tabular number, and a
 * small signed delta in green/red. No colour-chips or sparkline fills —
 * the number is the hero. The count-up on mount is the only motion.
 *
 * Props mirror the wider call sites (spark / sparkLabels / tone are
 * accepted but intentionally unused now) so pages don't need editing.
 */
import { computed, ref, watch } from 'vue'
import { ArrowUp, ArrowDown } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { useCountUp } from '@/composables/useCountUp'

export type KpiTone = 'info' | 'success' | 'warning' | 'destructive'

interface Props {
  label: string
  value: string | number
  delta?: { value: string; positive: boolean }
  spark?: number[]
  sparkLabels?: string[]
  hint?: string
  tone?: KpiTone
  icon?: any
}

const props = withDefaults(defineProps<Props>(), { tone: 'info' })

const valueParts = computed(() => {
  const raw = String(props.value)
  const match = raw.match(/^(-?[\d,]+(?:\.\d+)?)(.*)$/)
  if (!match) return { num: null as number | null, suffix: raw, precision: 0 }
  const numStr = match[1]!.replace(/,/g, '')
  const suffix = match[2] ?? ''
  const dotIdx = numStr.indexOf('.')
  const precision = dotIdx === -1 ? 0 : numStr.length - dotIdx - 1
  return { num: Number(numStr), suffix, precision }
})

const localTrigger = ref(false)
const displayNum = useCountUp(valueParts.value.num ?? 0, localTrigger, {
  duration: 600,
  precision: valueParts.value.precision,
})
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => { localTrigger.value = true })
}

const { current: persona } = usePersona()
watch(persona, () => {
  if (typeof window === 'undefined') return
  localTrigger.value = false
  requestAnimationFrame(() => { localTrigger.value = true })
})

const displayValue = computed(() => {
  if (valueParts.value.num === null) return String(props.value)
  const p = valueParts.value.precision
  const n = displayNum.value.toFixed(p)
  const grouped = p === 0 ? Number(n).toLocaleString('en-US') : n
  return `${grouped}${valueParts.value.suffix}`
})
</script>

<template>
  <Card>
    <CardContent class="p-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">{{ label }}</p>
        <component :is="icon" v-if="icon" class="text-muted-foreground/60 size-4 shrink-0" />
      </div>
      <p class="mt-3 text-3xl font-semibold leading-none tracking-tight tabular-nums">{{ displayValue }}</p>
      <div v-if="delta || hint" class="mt-3 flex items-center gap-2 text-xs">
        <span
          v-if="delta"
          :class="['inline-flex items-center gap-0.5 font-medium tabular-nums', delta.positive ? 'text-success' : 'text-destructive']"
        >
          <component :is="delta.positive ? ArrowUp : ArrowDown" class="size-3" />{{ delta.value }}
        </span>
        <span v-if="hint" class="text-muted-foreground">{{ hint }}</span>
      </div>
    </CardContent>
  </Card>
</template>
