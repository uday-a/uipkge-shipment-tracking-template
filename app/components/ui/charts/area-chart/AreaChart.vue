<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart as EChartsLineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { cn } from '@/lib/utils'
import { chartColors, chartTextColor, chartAxisColor, chartSplitLineColor, chartTooltipBg, chartTooltipBorder, chartTooltipText, mergeOptionBlock } from '../useChartTheme'

use([CanvasRenderer, EChartsLineChart, GridComponent, TooltipComponent, LegendComponent])

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
    type: 'line',
    smooth: true,
    symbol: 'none',
    areaStyle: { opacity: 0.15 },
    lineStyle: { width: 2 },
    itemStyle: { color: chartColors.value[i % chartColors.value.length] },
    data: props.data.map((d) => d[field]),
  }))

  // Deep-merge `series[i]` from `option` so consumers can pass partial
  // overrides (e.g. `series: [{ stack: 'r' }, ...]`) without clobbering the
  // computed `type`/`data`. Top-level option blocks (xAxis, yAxis, grid,
  // tooltip, legend) go through `mergeOptionBlock` so overrides like
  // `xAxis: { axisLabel: { fontSize: 9 } }` only replace the axisLabel
  // inner fields they touch, not the whole axisLabel (and never the data).
  const userOption: any = props.option ?? {}
  const { series: userSeries, xAxis: userXAxis, yAxis: userYAxis, grid: userGrid, tooltip: userTooltip, legend: userLegend, ...userRest } = userOption
  const mergedSeries = Array.isArray(userSeries)
    ? series.map((s, i) => ({ ...s, ...(userSeries[i] ?? {}) }))
    : series

  // Single-series charts hide the legend explicitly so ECharts' default
  // doesn't dump the y-field name (e.g. "y") onto the chart canvas.
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
      textStyle: { color: chartTooltipText.value, fontSize: 12 },
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
