<script setup lang="ts">
/**
 * Mock sign-in. Everything is theatre — the form takes any input and
 * lands on /dashboard. The "Continue as…" row is the real entry point:
 * it sets the demo persona and routes. Rendered without the dashboard
 * layout so the centred card owns the viewport.
 */
import { ref } from 'vue'
import { Mail, Lock, ArrowRight, Sparkles, Truck } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from 'vue-sonner'
import type { Persona } from '~/composables/usePersona'

useHead({ title: 'Sign in · ShipTrack' })
definePageMeta({ layout: false })

const { set: setPersona } = usePersona()

const email = ref('avery@shiptrack.dev')
const password = ref('')
const remember = ref(true)

async function handleSubmit() {
  toast.success('Signed in as Avery Quinn')
  await navigateTo('/dashboard')
}
async function continueWithSso(provider: 'Google' | 'Microsoft') {
  toast.info(`Continuing with ${provider} (mock)`)
  await navigateTo('/dashboard')
}
async function continueAs(persona: Persona, label: string) {
  setPersona(persona)
  toast.success(`Continuing as ${label}`)
  await navigateTo('/dashboard')
}
async function fakeForgot() {
  toast.info('Password reset link sent (mock)')
}
async function fakeSignUp() {
  toast.info('Sign-up is mocked — landing you on the dashboard')
  await navigateTo('/dashboard')
}

const personas: Array<{ key: Persona; label: string; tagline: string }> = [
  { key: 'admin', label: 'Admin', tagline: 'See everything' },
  { key: 'dispatcher', label: 'Dispatcher', tagline: 'Run operations' },
  { key: 'customer', label: 'Customer', tagline: 'Track my shipments' },
]
</script>

<template>
  <div class="min-h-screen grid place-items-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
    <div class="w-full max-w-md space-y-4">
      <Card class="rounded-2xl border-2 shadow-xl">
        <CardContent class="space-y-6 p-6 sm:p-8">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
                <Truck class="size-5" />
              </div>
              <div class="flex flex-col leading-tight">
                <span class="text-sm font-semibold tracking-tight">ShipTrack</span>
                <span class="text-muted-foreground text-xs">Shipment tracking · reference template</span>
              </div>
            </div>
            <div class="space-y-1 pt-2">
              <h1 class="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p class="text-muted-foreground text-sm">Sign in to your ShipTrack control tower.</p>
            </div>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div class="space-y-1.5">
              <Label for="email" class="text-sm font-medium">Work email</Label>
              <div class="relative">
                <Mail class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input id="email" v-model="email" type="email" name="email" autocomplete="username" placeholder="you@company.com" class="pl-9" />
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label for="password" class="text-sm font-medium">Password</Label>
                <Button type="button" variant="ghost" size="sm" class="h-auto px-1 text-xs font-medium" @click="fakeForgot">Forgot password?</Button>
              </div>
              <div class="relative">
                <Lock class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input id="password" v-model="password" type="password" name="password" autocomplete="current-password" show-password-toggle placeholder="••••••••" class="pl-9" />
              </div>
            </div>

            <label class="flex cursor-pointer items-center gap-2">
              <Checkbox id="remember" v-model="remember" />
              <span class="text-muted-foreground text-sm">Remember me on this device</span>
            </label>

            <Button type="submit" class="w-full">Sign in<ArrowRight class="ml-2 size-4" /></Button>
          </form>

          <div class="relative">
            <Separator />
            <span class="bg-card text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs font-medium uppercase tracking-wide">Or continue with</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" class="w-full" @click="continueWithSso('Google')">
              <svg class="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
              </svg>
              Google
            </Button>
            <Button type="button" variant="outline" class="w-full" @click="continueWithSso('Microsoft')">
              <svg class="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
                <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
                <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
                <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
              </svg>
              Microsoft
            </Button>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-1.5">
              <Sparkles class="text-primary size-3.5" />
              <p class="text-xs font-semibold">Continue as</p>
            </div>
            <p class="text-muted-foreground text-xs">Skip auth and jump straight in — this is a mock template.</p>
            <div class="flex divide-x rounded-lg border overflow-hidden">
              <button
                v-for="p in personas"
                :key="p.key"
                type="button"
                class="hover:bg-muted/60 group flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-center transition-colors"
                @click="continueAs(p.key, p.label)"
              >
                <span class="text-sm font-medium">{{ p.label }}</span>
                <span class="text-muted-foreground text-xs">{{ p.tagline }}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <p class="text-muted-foreground text-center text-sm">
        Don't have an account?
        <Button variant="link" class="h-auto p-0 text-sm font-medium" @click="fakeSignUp">Sign up</Button>
      </p>
    </div>
  </div>
</template>
