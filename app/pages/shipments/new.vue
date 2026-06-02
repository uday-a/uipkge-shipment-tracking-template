<script setup lang="ts">
/**
 * Create shipment — a mock booking form. Validates required fields then
 * toasts + routes back to the ledger (no real persistence). Dispatcher-gated.
 */
import { ref, computed } from 'vue'
import { ArrowLeft, PackagePlus, Building2, MapPin, Box, Truck } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'vue-sonner'

import { CARRIERS, SERVICE_LEVELS, SERVICE_LABELS, PRIORITIES, PRIORITY_LABELS } from '~/mocks/shipments'
import { CUSTOMERS } from '~/mocks/customers'

definePageMeta({ middleware: 'require-dispatcher' })
useHead({ title: 'New shipment · ShipTrack' })

const form = ref({
  customerId: '',
  service: 'standard',
  priority: 'medium',
  carrier: 'ShipTrack Fleet',
  origin: '',
  destination: '',
  weightKg: '' as string | number,
  pieces: '' as string | number,
  contents: '',
  valueUsd: '' as string | number,
  notes: '',
})

const errors = ref<Record<string, boolean>>({})

function validate() {
  const e: Record<string, boolean> = {}
  if (!form.value.customerId) e.customerId = true
  if (!form.value.origin.trim()) e.origin = true
  if (!form.value.destination.trim()) e.destination = true
  if (!form.value.weightKg) e.weightKg = true
  if (!form.value.pieces) e.pieces = true
  if (!form.value.contents.trim()) e.contents = true
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) {
    toast.warning('Fill in the required fields')
    return
  }
  const customer = CUSTOMERS.find((c) => c.id === form.value.customerId)
  toast.success(`Shipment booked for ${customer?.name ?? 'customer'} (mock)`)
  navigateTo('/shipments')
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-3 p-3 md:p-4">
    <Button variant="ghost" size="sm" class="text-muted-foreground -ml-2" as-child>
      <NuxtLink to="/shipments"><ArrowLeft class="mr-2 size-4" />Back to shipments</NuxtLink>
    </Button>

    <header>
      <h1 class="text-xl font-bold tracking-tight">New shipment</h1>
      <p class="text-muted-foreground text-xs">Book a pickup and generate a tracking number.</p>
    </header>

    <form class="space-y-3" @submit.prevent="submit">
      <!-- Customer + service -->
      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="flex items-center gap-2 text-sm"><Building2 class="size-4" />Account & service</CardTitle>
          <CardDescription>Who's shipping and how fast.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 p-4 pt-0 md:grid-cols-2">
          <div class="space-y-2">
            <Label>Customer <span class="text-destructive">*</span></Label>
            <Select v-model="form.customerId">
              <SelectTrigger :class="errors.customerId ? 'border-destructive' : ''"><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in CUSTOMERS" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Carrier</Label>
            <Select v-model="form.carrier">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in CARRIERS" :key="c" :value="c">{{ c }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Service level</Label>
            <Select v-model="form.service">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in SERVICE_LEVELS" :key="s" :value="s">{{ SERVICE_LABELS[s] }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Priority</Label>
            <Select v-model="form.priority">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- Route -->
      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="flex items-center gap-2 text-sm"><MapPin class="size-4" />Route</CardTitle>
          <CardDescription>Pickup and delivery locations.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 p-4 pt-0 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="origin">Origin <span class="text-destructive">*</span></Label>
            <Input id="origin" v-model="form.origin" placeholder="e.g. Los Angeles, CA" :class="errors.origin ? 'border-destructive' : ''" />
          </div>
          <div class="space-y-2">
            <Label for="dest">Destination <span class="text-destructive">*</span></Label>
            <Input id="dest" v-model="form.destination" placeholder="e.g. Chicago, IL" :class="errors.destination ? 'border-destructive' : ''" />
          </div>
        </CardContent>
      </Card>

      <!-- Package -->
      <Card>
        <CardHeader class="p-4 pb-2">
          <CardTitle class="flex items-center gap-2 text-sm"><Box class="size-4" />Package</CardTitle>
          <CardDescription>What's in the shipment.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 p-4 pt-0">
          <div class="grid gap-3 md:grid-cols-3">
            <div class="space-y-2">
              <Label for="weight">Weight (kg) <span class="text-destructive">*</span></Label>
              <Input id="weight" v-model="form.weightKg" type="number" min="0" placeholder="0" :class="errors.weightKg ? 'border-destructive' : ''" />
            </div>
            <div class="space-y-2">
              <Label for="pieces">Pieces <span class="text-destructive">*</span></Label>
              <Input id="pieces" v-model="form.pieces" type="number" min="1" placeholder="1" :class="errors.pieces ? 'border-destructive' : ''" />
            </div>
            <div class="space-y-2">
              <Label for="value">Declared value (USD)</Label>
              <Input id="value" v-model="form.valueUsd" type="number" min="0" placeholder="0" />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="contents">Contents <span class="text-destructive">*</span></Label>
            <Input id="contents" v-model="form.contents" placeholder="e.g. Consumer electronics" :class="errors.contents ? 'border-destructive' : ''" />
          </div>
          <div class="space-y-2">
            <Label for="notes">Handling notes</Label>
            <Textarea id="notes" v-model="form.notes" rows="2" placeholder="Fragile, keep upright, etc." />
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div class="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" as-child><NuxtLink to="/shipments">Cancel</NuxtLink></Button>
        <Button type="submit"><PackagePlus class="mr-2 size-4" />Book shipment</Button>
      </div>
    </form>
  </div>
</template>
