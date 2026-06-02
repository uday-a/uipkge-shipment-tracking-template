<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart as EChartsLineChart, BarChart as EChartsBarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { cn } from '@/lib/utils'
import { chartColors, toRgba } from '../useChartTheme'

// Bar + grid + tooltip registered alongside line so consumers can swap
// `type: 'bar'` via the option escape hatch (bar / win-loss sparklines)
// without having to `use()`-register the extras in their own code.
use([CanvasRenderer, EChartsLineChart, EChartsBarChart, GridComponent, TooltipComponent])

interface Props {
  data: number[]
  color?: string
  height?: number | string
  option?: any
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 40,
  color: chartColors.value[1],
})

const mergedOption = computed(() => {
  const series = [
    {
      type: 'line',
      smooth: true,
      // Show a dot only at the last datapoint so the eye can find the
      // current value; intermediate dots clutter at sparkline density.
      showSymbol: false,
      showAllSymbol: false,
      symbol: 'circle',
      symbolSize: 5,
      endLabel: { show: false },
      lineStyle: { width: 1.75, color: props.color },
      itemStyle: { color: props.color, borderColor: props.color, borderWidth: 0 },
      data: props.data.map((v, i) => ({
        value: v,
        symbol: i === props.data.length - 1 ? 'circle' : 'none',
        symbolSize: i === props.data.length - 1 ? 5 : 0,
      })),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: toRgba(props.color, 0.18) },
            { offset: 1, color: toRgba(props.color, 0) },
          ],
        },
      },
    },
  ]

  // Per-index series merge — partial overrides keep computed `type`/`data`.
  // Sparkline gets bar / win-loss variants this way (override `type: 'bar'`,
  // pass new data, the rest stays).
  const userOption: any = props.option ?? {}
  const { series: userSeries, ...userRest } = userOption
  const mergedSeries = Array.isArray(userSeries)
    ? series.map((s, i) => ({ ...s, ...(userSeries[i] ?? {}) }))
    : series

  return {
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { type: 'category', show: false, data: props.data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: (value: any) => value.min * 0.9 },
    tooltip: { show: false },
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
