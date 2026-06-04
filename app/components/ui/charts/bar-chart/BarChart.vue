<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart as EChartsBarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { cn } from '@/lib/utils'
import { chartColors, chartTextColor, chartAxisColor, chartSplitLineColor, chartTooltipBg, chartTooltipBorder, chartTooltipText, mergeOptionBlock } from '../useChartTheme'

use([CanvasRenderer, EChartsBarChart, GridComponent, TooltipComponent, LegendComponent])

interface Props {
  data: Record<string, any>[]
  xField?: string
  yField?: string | string[]
  height?: number | string
  option?: any
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  xField: 'x',
  yField: 'y',
  height: 300,
})

const mergedOption = computed(() => {
  const fields = Array.isArray(props.yField) ? props.yField : [props.yField]
  const xData = props.data.map((d) => d[props.xField!])

  const series = fields.map((field, i) => ({
    name: field,
    type: 'bar',
    barMaxWidth: 32,
    itemStyle: { color: chartColors.value[i % chartColors.value.length] },
    data: props.data.map((d) => d[field]),
  }))

  // Per-index series merge + 2-level deep merge for axis/grid/tooltip
  // blocks (see AreaChart for the rule). Lets consumers tweak axisLabel
  // font size without losing the wrapper's `data` / colors.
  const userOption: any = props.option ?? {}
  const { series: userSeries, xAxis: userXAxis, yAxis: userYAxis, grid: userGrid, tooltip: userTooltip, legend: userLegend, ...userRest } = userOption
  const mergedSeries = Array.isArray(userSeries)
    ? series.map((s, i) => ({ ...s, ...(userSeries[i] ?? {}) }))
    : series

  // Single-series charts hide the legend explicitly so ECharts' default
  // doesn't dump the y-field name onto the chart canvas.
  const baseLegend: any = fields.length > 1
    ? { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: chartTextColor.value } }
    : { show: false }

  return {
    color: chartColors.value,
    grid: mergeOptionBlock({ left: 4, right: 4, top: 8, bottom: 4, containLabel: true }, userGrid),
    tooltip: mergeOptionBlock({
      trigger: 'axis',
      backgroundColor: chartTooltipBg.value,
      borderColor: chartTooltipBorder.value,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: chartTooltipText.value, fontSize: 12 },
      extraCssText: 'border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.18);',
    }, userTooltip),
    legend: userLegend?.show === false ? undefined : mergeOptionBlock(baseLegend, userLegend),
    xAxis: mergeOptionBlock({
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: chartAxisColor.value } },
      axisLabel: { color: chartTextColor.value, fontSize: 11 },
      axisTick: { show: false },
    }, userXAxis),
    yAxis: mergeOptionBlock({
      type: 'value',
      splitLine: { lineStyle: { color: chartSplitLineColor.value } },
      axisLabel: { color: chartTextColor.value, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    }, userYAxis),
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
