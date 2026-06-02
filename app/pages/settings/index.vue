<script setup lang="ts">
/**
 * Settings — one page, tabbed. Profile (incl. a demo persona switch),
 * appearance (theme wired to the real cookie-backed composable),
 * notifications, integrations, and an admin-only organization tab. Every
 * mutation is toast-only; the mock store is read-only.
 */
import { ref, computed, watch } from 'vue'
import {
  User, Palette, Bell, Plug, Building2, Save, Link as LinkIcon,
  Slack, MessageSquare, MapPin, FileSpreadsheet, Webhook, KeyRound, Plus, Trash2,
} from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'
import { PERSONA_LABELS, type Persona } from '~/composables/usePersona'

useHead({ title: 'Settings · ShipTrack' })

const { isAdmin, current: persona, set: setPersona } = usePersona()

// ── Profile ────────────────────────────────────────────────────────
const profile = ref({
  name: 'Avery Quinn',
  email: 'avery.quinn@shiptrack.dev',
  role: 'Operations Lead',
  phone: '+1 415-555-0100',
  timezone: 'America/Los_Angeles',
  bio: 'Runs the West Coast control tower. Obsessed with on-time rate.',
})

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
  { value: 'America/Denver', label: 'America/Denver (MT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CT)' },
  { value: 'America/New_York', label: 'America/New_York (ET)' },
  { value: 'UTC', label: 'UTC' },
]

function saveProfile() {
  toast.success('Profile saved (mock)')
}

// ── Appearance ─────────────────────────────────────────────────────
const { theme, setTheme } = useTheme()
const appearance = ref({ theme: theme.value, density: 'cozy' as 'comfortable' | 'cozy' | 'compact' })
watch(() => appearance.value.theme, (next) => {
  if (next !== theme.value) setTheme(next)
})
function saveAppearance() {
  toast.success('Appearance saved (mock)')
}

// ── Notifications ──────────────────────────────────────────────────
const notifications = ref({
  exceptionRaised: true,
  shipmentDelayed: true,
  deliveryConfirmed: true,
  pickupScheduled: false,
  capacityAlert: true,
  customsHold: true,
  dailyDigest: false,
  weeklyDigest: true,
})
function saveNotifications() {
  toast.success('Notification preferences saved (mock)')
}

// ── Integrations ───────────────────────────────────────────────────
const integrations = ref([
  { id: 'slack', name: 'Slack', description: 'Push exceptions + delivery alerts to channels.', icon: Slack, connected: true },
  { id: 'twilio', name: 'SMS notifications', description: 'Text customers tracking updates.', icon: MessageSquare, connected: true },
  { id: 'maps', name: 'Mapping provider', description: 'Live ETA + route optimization.', icon: MapPin, connected: false },
  { id: 'sheets', name: 'Spreadsheet export', description: 'Scheduled CSV of the shipment ledger.', icon: FileSpreadsheet, connected: true },
  { id: 'webhook', name: 'Webhooks', description: 'POST shipment events to your endpoint.', icon: Webhook, connected: false },
])
function toggleIntegration(id: string) {
  const row = integrations.value.find((i) => i.id === id)
  if (!row) return
  row.connected = !row.connected
  toast[row.connected ? 'success' : 'warning'](`${row.connected ? 'Connected' : 'Disconnected'} ${row.name} (mock)`)
}

// ── Organization (admin) ───────────────────────────────────────────
const org = ref({
  name: 'ShipTrack Logistics',
  domain: 'shiptrack.dev',
  hq: 'Los Angeles, CA',
  units: 'imperial',
})
function saveOrg() {
  toast.success('Organization settings saved (mock)')
}
const apiKeys = ref([
  { id: 'k1', name: 'Production webhook', lastUsed: '2026-05-28, 06:00' },
  { id: 'k2', name: 'Carrier EDI bridge', lastUsed: '2026-05-27, 22:14' },
  { id: 'k3', name: 'Dev test key', lastUsed: '2026-05-20, 11:08' },
])
function revokeKey(name: string) {
  toast.warning(`Revoked ${name} (mock)`)
}
function createApiKey() {
  toast.info('Open API key creation flow (mock)')
}
</script>

<template>
  <div class="space-y-5 p-4 md:p-6">
    <header class="space-y-1">
      <h1 class="text-xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground text-xs">
        Personal preferences, notifications, integrations, and (admin) workspace controls.
      </p>
    </header>

    <Tabs default-value="profile">
      <TabsList class="flex flex-wrap">
        <TabsTrigger value="profile"><User class="mr-1.5 size-3.5" />Profile</TabsTrigger>
        <TabsTrigger value="appearance"><Palette class="mr-1.5 size-3.5" />Appearance</TabsTrigger>
        <TabsTrigger value="notifications"><Bell class="mr-1.5 size-3.5" />Notifications</TabsTrigger>
        <TabsTrigger value="integrations"><Plug class="mr-1.5 size-3.5" />Integrations</TabsTrigger>
        <ClientOnly>
          <TabsTrigger v-if="isAdmin" value="organization"><Building2 class="mr-1.5 size-3.5" />Organization</TabsTrigger>
        </ClientOnly>
      </TabsList>

      <!-- Profile -->
      <TabsContent value="profile" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Personal information</CardTitle>
            <CardDescription>How you appear across the control tower and customer notifications.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 p-4 pt-0">
            <div class="grid gap-3 md:grid-cols-2">
              <div class="space-y-2"><Label for="name">Full name</Label><Input id="name" v-model="profile.name" /></div>
              <div class="space-y-2">
                <Label for="email">Work email</Label>
                <Input id="email" v-model="profile.email" disabled />
                <p class="text-muted-foreground text-xs">Managed by IT. Open a ticket to change.</p>
              </div>
              <div class="space-y-2"><Label for="role">Role</Label><Input id="role" v-model="profile.role" /></div>
              <div class="space-y-2"><Label for="phone">Phone</Label><Input id="phone" v-model="profile.phone" /></div>
              <div class="space-y-2">
                <Label>Timezone</Label>
                <Select v-model="profile.timezone">
                  <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="tz in TIMEZONES" :key="tz.value" :value="tz.value">{{ tz.label }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="space-y-2"><Label for="bio">Bio</Label><Textarea id="bio" v-model="profile.bio" rows="2" /></div>
            <Separator />
            <div class="flex items-center justify-end gap-2">
              <Button variant="ghost">Discard</Button>
              <Button @click="saveProfile"><Save class="mr-2 size-3.5" />Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Demo persona</CardTitle>
            <CardDescription>Switch the role this demo simulates — also available from the topbar avatar.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <ClientOnly>
              <RadioGroup :model-value="persona" class="grid gap-3 sm:grid-cols-3" @update:model-value="(v) => setPersona(v as Persona)">
                <label
                  v-for="opt in (['admin', 'dispatcher', 'customer'] as Persona[])"
                  :key="opt"
                  :class="['flex items-center gap-3 rounded-md border p-2.5 cursor-pointer transition-colors', persona === opt ? 'border-primary bg-primary/5' : 'hover:bg-muted/40']"
                >
                  <RadioGroupItem :value="opt" />
                  <div>
                    <p class="text-sm font-medium">{{ PERSONA_LABELS[opt] }}</p>
                    <p class="text-muted-foreground text-xs">
                      <template v-if="opt === 'admin'">Full network + workspace admin.</template>
                      <template v-else-if="opt === 'dispatcher'">Operations: shipments, fleet, network.</template>
                      <template v-else>Own shipments + tracking only.</template>
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </ClientOnly>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Appearance -->
      <TabsContent value="appearance" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Theme</CardTitle>
            <CardDescription>Light, dark, or follow your operating system.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <RadioGroup v-model="appearance.theme" class="grid gap-3 sm:grid-cols-3">
              <label
                v-for="opt in (['light', 'dark', 'system'] as const)"
                :key="opt"
                :class="['flex items-center gap-3 rounded-md border p-2 cursor-pointer transition-colors', appearance.theme === opt ? 'border-primary bg-primary/5' : 'hover:bg-muted/40']"
              >
                <RadioGroupItem :value="opt" />
                <div>
                  <p class="text-sm font-medium capitalize">{{ opt }}</p>
                  <p class="text-muted-foreground text-xs">
                    <template v-if="opt === 'light'">Always light.</template>
                    <template v-else-if="opt === 'dark'">Always dark.</template>
                    <template v-else>Match the OS.</template>
                  </p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Table density</CardTitle>
            <CardDescription>How tightly the shipment ledger packs rows.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 p-4 pt-0">
            <RadioGroup v-model="appearance.density" class="grid gap-3 sm:grid-cols-3">
              <label
                v-for="opt in (['comfortable', 'cozy', 'compact'] as const)"
                :key="opt"
                :class="['flex items-center gap-3 rounded-md border p-2 cursor-pointer transition-colors', appearance.density === opt ? 'border-primary bg-primary/5' : 'hover:bg-muted/40']"
              >
                <RadioGroupItem :value="opt" />
                <p class="text-sm font-medium capitalize">{{ opt }}</p>
              </label>
            </RadioGroup>
            <Separator />
            <div class="flex items-center justify-end">
              <Button @click="saveAppearance"><Save class="mr-2 size-3.5" />Save changes</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Notifications -->
      <TabsContent value="notifications" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Email notifications</CardTitle>
            <CardDescription>Choose which events email you. In-app alerts stay on for everything.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 p-4 pt-0">
            <div class="space-y-3">
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Shipment events</p>
              <label v-for="row in [
                  { key: 'exceptionRaised', label: 'Exception raised', desc: 'A shipment hits a hold, damage, or address issue.' },
                  { key: 'shipmentDelayed', label: 'Shipment delayed', desc: 'ETA slips past the committed window.' },
                  { key: 'deliveryConfirmed', label: 'Delivery confirmed', desc: 'Proof of delivery is recorded.' },
                  { key: 'pickupScheduled', label: 'Pickup scheduled', desc: 'A new pickup is booked.' },
                ]"
                :key="row.key"
                class="flex items-start gap-3 rounded-md border p-2"
              >
                <Checkbox :model-value="(notifications as any)[row.key]" @update:model-value="(v) => ((notifications as any)[row.key] = !!v)" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">{{ row.label }}</p>
                  <p class="text-muted-foreground text-xs">{{ row.desc }}</p>
                </div>
              </label>
            </div>
            <Separator />
            <div class="space-y-3">
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Operations</p>
              <label v-for="row in [
                  { key: 'capacityAlert', label: 'Warehouse capacity alert', desc: 'A DC crosses 90% capacity.' },
                  { key: 'customsHold', label: 'Customs hold', desc: 'International freight flagged for review.' },
                ]"
                :key="row.key"
                class="flex items-start gap-3 rounded-md border p-2"
              >
                <Checkbox :model-value="(notifications as any)[row.key]" @update:model-value="(v) => ((notifications as any)[row.key] = !!v)" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">{{ row.label }}</p>
                  <p class="text-muted-foreground text-xs">{{ row.desc }}</p>
                </div>
              </label>
            </div>
            <Separator />
            <div class="space-y-3">
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Digest</p>
              <label v-for="row in [
                  { key: 'dailyDigest', label: 'Daily summary', desc: '7am roundup of overnight activity.' },
                  { key: 'weeklyDigest', label: 'Weekly summary', desc: 'Friday performance recap.' },
                ]"
                :key="row.key"
                class="flex items-start gap-3 rounded-md border p-2"
              >
                <Checkbox :model-value="(notifications as any)[row.key]" @update:model-value="(v) => ((notifications as any)[row.key] = !!v)" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">{{ row.label }}</p>
                  <p class="text-muted-foreground text-xs">{{ row.desc }}</p>
                </div>
              </label>
            </div>
            <Separator />
            <div class="flex items-center justify-end">
              <Button @click="saveNotifications"><Save class="mr-2 size-3.5" />Save changes</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Integrations -->
      <TabsContent value="integrations" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Connected services</CardTitle>
            <CardDescription>Wire ShipTrack events into the tools your team already uses.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <div v-for="row in integrations" :key="row.id" class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2">
              <div class="flex items-center gap-3">
                <div class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                  <component :is="row.icon" class="size-5" />
                </div>
                <div>
                  <p class="text-sm font-medium">{{ row.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ row.description }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="row.connected ? 'success' : 'secondary'">{{ row.connected ? 'Connected' : 'Disconnected' }}</Badge>
                <Button :variant="row.connected ? 'outline' : 'default'" size="sm" @click="toggleIntegration(row.id)">
                  <LinkIcon class="mr-2 size-3.5" />{{ row.connected ? 'Disconnect' : 'Connect' }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Organization (admin) -->
      <TabsContent v-if="isAdmin" value="organization" class="space-y-6">
        <ClientOnly>
          <Card>
            <CardHeader class="p-4 pb-2">
              <CardTitle class="text-sm">Company info</CardTitle>
              <CardDescription>Surfaced on labels, the customer portal, and BOL documents.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4 p-4 pt-0">
              <div class="grid gap-3 md:grid-cols-3">
                <div class="space-y-2"><Label for="org-name">Company name</Label><Input id="org-name" v-model="org.name" /></div>
                <div class="space-y-2"><Label for="org-domain">Primary domain</Label><Input id="org-domain" v-model="org.domain" /></div>
                <div class="space-y-2"><Label for="org-hq">HQ location</Label><Input id="org-hq" v-model="org.hq" /></div>
              </div>
              <div class="space-y-2 md:w-1/3">
                <Label>Units</Label>
                <Select v-model="org.units">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">Imperial (lb, mi)</SelectItem>
                    <SelectItem value="metric">Metric (kg, km)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex items-center justify-end">
                <Button @click="saveOrg"><Save class="mr-2 size-3.5" />Save changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="p-4 pb-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <CardTitle class="text-sm">API keys</CardTitle>
                  <CardDescription>Server-to-server credentials for carrier feeds and webhooks.</CardDescription>
                </div>
                <Button size="sm" @click="createApiKey"><Plus class="mr-2 size-3.5" />New key</Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-1.5 p-4 pt-0">
              <div v-for="key in apiKeys" :key="key.id" class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2">
                <div class="flex items-center gap-3">
                  <div class="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                    <KeyRound class="size-4" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">{{ key.name }}</p>
                    <p class="text-muted-foreground text-xs">Last used {{ key.lastUsed }}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="revokeKey(key.name)">
                  <Trash2 class="mr-2 size-3.5" />Revoke
                </Button>
              </div>
            </CardContent>
          </Card>
        </ClientOnly>
      </TabsContent>
    </Tabs>
  </div>
</template>
