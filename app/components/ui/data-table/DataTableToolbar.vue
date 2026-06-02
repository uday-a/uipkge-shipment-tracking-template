<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { FilterDefinition, FilterOption } from './DataTable.vue'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { CalendarIcon, Check, Download, ListFilter, Plus, SlidersHorizontal, X } from 'lucide-vue-next'
import DataTableFilterPopover from './DataTableFilterPopover.vue'

function resolveOption(opt: string | FilterOption): FilterOption {
  if (typeof opt === 'string') return { value: opt, label: opt }
  return opt
}

withDefaults(
  defineProps<{
    table: Table<any>
    filterColumn: string
    filterPlaceholder: string
    filters: FilterDefinition[]
    filterMode: 'inline' | 'modal' | 'popover'
    enableSearch?: boolean
    enableColumnVisibility?: boolean
    enableExport?: boolean
    activeFilterCount: number
    isAnyFilterActive: boolean
    isServerSide: boolean
    getMultiSelectValue: (column: string) => string[]
    getDateRangeValue: (column: string) => { from?: string; to?: string }
    getFilterSelectedLabels: (filter: FilterDefinition) => string[]
    formatDateRange: (column: string) => string
    getCalendarModel: (column: string) => any
  }>(),
  { enableSearch: true, enableColumnVisibility: true, enableExport: false },
)

const emit = defineEmits<{
  (e: 'search', value: string): void
  (e: 'open-filter-sheet' | 'clear-all-filters' | 'apply-filters' | 'export-csv'): void
  (e: 'toggle-multiselect', column: string, value: string): void
  (e: 'clear-filter' | 'clear-date-filter', filter: FilterDefinition): void
  (e: 'calendar-update', column: string, value: any): void
  (e: 'text-filter-update', column: string, value: string | undefined): void
}>()
</script>

<template>
  <div class="flex flex-col gap-2 border-b px-4 py-3">
    <div class="flex items-center gap-2">
      <!-- Search only renders when filterColumn maps to an actual column
           in the table; otherwise TanStack's getColumn() logs a noisy
           "[Table] Column with id '<x>' does not exist" warning even
           though our optional-chaining keeps the call safe. -->
      <Input
        v-if="enableSearch && filterColumn && table.getColumn(filterColumn)"
        class="h-9 max-w-xs"
        :placeholder="filterPlaceholder"
        :model-value="table.getColumn(filterColumn)?.getFilterValue() as string"
        @update:model-value="emit('search', $event as string)"
      />

      <!-- ── INLINE filter mode ── -->
      <template v-if="filterMode === 'inline'">
        <template v-for="filter in filters" :key="filter.column">
          <!-- Multiselect / Select -->
          <Popover v-if="filter.type === 'multiselect' || filter.type === 'select'">
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" class="h-9 border-dashed">
                <Plus class="size-4" />
                {{ filter.label }}
                <template v-if="getMultiSelectValue(filter.column).length > 0">
                  <Separator orientation="vertical" class="mx-1 h-4" />
                  <div class="flex gap-1">
                    <Badge
                      v-if="getMultiSelectValue(filter.column).length > 2"
                      variant="secondary"
                      class="rounded-sm px-1 font-normal"
                    >
                      {{ getMultiSelectValue(filter.column).length }} selected
                    </Badge>
                    <template v-else>
                      <Badge
                        v-for="label in getFilterSelectedLabels(filter)"
                        :key="label"
                        variant="secondary"
                        class="rounded-sm px-1 font-normal"
                      >
                        {{ label }}
                      </Badge>
                    </template>
                  </div>
                </template>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-52 p-0" align="start">
              <Command>
                <CommandInput :placeholder="`Search ${filter.label.toLowerCase()}...`" />
                <CommandList>
                  <CommandEmpty>No results.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      v-for="rawOpt in filter.options"
                      :key="resolveOption(rawOpt).value"
                      :value="resolveOption(rawOpt).label"
                      @select="emit('toggle-multiselect', filter.column, resolveOption(rawOpt).value)"
                    >
                      <div
                        class="border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border"
                        :class="[
                          getMultiSelectValue(filter.column).includes(resolveOption(rawOpt).value)
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        ]"
                      >
                        <Check class="size-3" />
                      </div>
                      <component
                        :is="resolveOption(rawOpt).icon"
                        v-if="resolveOption(rawOpt).icon"
                        class="text-muted-foreground size-4"
                      />
                      <span>{{ resolveOption(rawOpt).label }}</span>
                    </CommandItem>
                  </CommandGroup>
                  <template v-if="getMultiSelectValue(filter.column).length > 0">
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value="__clear__"
                        class="justify-center text-center"
                        @select="emit('clear-filter', filter)"
                      >
                        Clear filter
                      </CommandItem>
                    </CommandGroup>
                  </template>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <!-- Date range filter -->
          <Popover v-else-if="filter.type === 'date'">
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" class="h-9 border-dashed">
                <CalendarIcon class="size-4" />
                {{ filter.label }}
                <template v-if="getDateRangeValue(filter.column).from || getDateRangeValue(filter.column).to">
                  <Separator orientation="vertical" class="mx-1 h-4" />
                  <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                    {{ formatDateRange(filter.column) }}
                  </Badge>
                </template>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <RangeCalendar
                :model-value="getCalendarModel(filter.column)"
                initial-focus
                :number-of-months="2"
                @update:model-value="emit('calendar-update', filter.column, $event)"
              />
              <div
                v-if="getDateRangeValue(filter.column).from || getDateRangeValue(filter.column).to"
                class="border-t p-2"
              >
                <Button variant="ghost" size="sm" class="h-7 w-full text-xs" @click="emit('clear-date-filter', filter)">
                  Clear dates
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Text filter -->
          <Popover v-else-if="filter.type === 'text'">
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" class="h-9 border-dashed">
                <Plus class="size-4" />
                {{ filter.label }}
                <template v-if="table.getColumn(filter.column)?.getFilterValue() as string">
                  <Separator orientation="vertical" class="mx-1 h-4" />
                  <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                    {{ table.getColumn(filter.column)?.getFilterValue() }}
                  </Badge>
                </template>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-60 p-3" align="start">
              <div class="space-y-2">
                <p class="text-sm font-medium">{{ filter.label }}</p>
                <Input
                  :placeholder="`Filter by ${filter.label.toLowerCase()}...`"
                  :model-value="(table.getColumn(filter.column)?.getFilterValue() as string) ?? ''"
                  class="h-8 text-sm"
                  @update:model-value="table.getColumn(filter.column)?.setFilterValue($event || undefined)"
                />
              </div>
            </PopoverContent>
          </Popover>
        </template>
      </template>

      <!-- ── MODAL filter mode (Sheet from the right) ── -->
      <template v-if="filterMode === 'modal'">
        <Button
          variant="outline"
          size="sm"
          class="h-9"
          :class="[activeFilterCount > 0 ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10' : '']"
          @click="emit('open-filter-sheet')"
        >
          <SlidersHorizontal class="size-4" />
          Filters
          <Badge
            v-if="activeFilterCount > 0"
            class="bg-primary text-primary-foreground ml-0.5 size-5 rounded-full p-0 text-xs font-semibold"
          >
            {{ activeFilterCount }}
          </Badge>
        </Button>
      </template>

      <!-- ── POPOVER filter mode ── -->
      <template v-if="filterMode === 'popover' && filters.length">
        <DataTableFilterPopover
          :table="table"
          :filters="filters"
          :active-filter-count="activeFilterCount"
          :is-any-filter-active="isAnyFilterActive"
          :is-server-side="isServerSide"
          :get-multi-select-value="getMultiSelectValue"
          :get-date-range-value="getDateRangeValue"
          :format-date-range="formatDateRange"
          :get-calendar-model="getCalendarModel"
          @apply="emit('apply-filters')"
          @clear-all="emit('clear-all-filters')"
          @toggle-multiselect="(c, v) => emit('toggle-multiselect', c, v)"
          @clear-filter="(f) => emit('clear-filter', f)"
          @clear-date-filter="(f) => emit('clear-date-filter', f)"
          @calendar-update="(c, v) => emit('calendar-update', c, v)"
          @text-filter-update="(c, v) => emit('text-filter-update', c, v)"
        >
          <template v-if="$slots['custom-filters']" #custom-filters>
            <slot name="custom-filters" />
          </template>
        </DataTableFilterPopover>
      </template>

      <!-- Inline custom filters (when filterMode === 'inline') -->
      <slot v-if="filterMode === 'inline'" name="custom-filters" />

      <!-- Toolbar extras (e.g. group-by selector, density toggle) -->
      <slot name="toolbar-extra" />

      <!-- Reset button -->
      <Button v-if="isAnyFilterActive" variant="ghost" size="sm" class="h-9" @click="emit('clear-all-filters')">
        Reset
        <X class="size-4" />
      </Button>

      <!-- Export CSV -->
      <Button v-if="enableExport" variant="outline" size="sm" class="h-9 ml-auto" @click="emit('export-csv')">
        <Download class="size-3.5" />
        Export
      </Button>

      <!-- Column Visibility -->
      <div v-if="enableColumnVisibility" :class="enableExport ? '' : 'ml-auto'">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-9">
              <ListFilter class="size-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
              :key="column.id"
              class="capitalize"
              :checked="column.getIsVisible()"
              @update:checked="(value: boolean) => column.toggleVisibility(!!value)"
            >
              {{ column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>
