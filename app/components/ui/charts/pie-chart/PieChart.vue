<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart as EChartsPieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { cn } from '@/lib/utils'
import { chartColors, chartTooltipBg, chartTooltipBorder, chartTooltipText } from '../useChartTheme'

use([CanvasRenderer, EChartsPieChart, TooltipComponent, LegendComponent])

interface Props {
  data: Record<string, any>[]
  nameField?: string
  valueField?: string
  height?: number | string
  donut?: boolean
  option?: any
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  nameField: 'name',
  valueField: 'value',
  height: 300,
  donut: false,
})

const mergedOption = computed(() => {
  const chartData = props.data.map((d) => ({
    name: d[props.nameField!],
    value: d[props.valueField!],
  }))

  const series = [
    {
      type: 'pie',
      radius: props.donut ? ['40%', '78%'] : '72%',
      center: ['50%', '50%'],
      itemStyle: { borderWidth: 0 },
      label: { show: false },
      data: chartData,
    },
  ]

  // Per-index series merge — partial overrides keep computed `type`/`data`.
  const userOption: any = props.option ?? {}
  const { series: userSeries, ...userRest } = userOption
  const mergedSeries = Array.isArray(userSeries)
    ? series.map((s, i) => ({ ...s, ...(userSeries[i] ?? {}) }))
    : series

  return {
    color: chartColors.value,
    tooltip: {
      trigger: 'item',
      backgroundColor: chartTooltipBg.value,
      borderColor: chartTooltipBorder.value,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: chartTooltipText.value, fontSize: 12 },
      formatter: '{b}: {c} ({d}%)',
      extraCssText: 'border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.18);',
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11 },
    },
    series: mergedSeries,
    ...userRest,
  }
})
</script>

<template>
  <div
    :style="{ height: /^\d+$/.test(String(height)) ? `${height}px` : String(height) }"
    :class="cn('w-full', props.class)"
  >
    <VChart :option="mergedOption" :autoresize="true" class="size-full" />
  </div>
</template>
