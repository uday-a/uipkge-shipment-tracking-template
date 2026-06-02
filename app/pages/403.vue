<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ShieldOff } from 'lucide-vue-next'

useHead({ title: '403 — Not allowed · ShipTrack' })
</script>

<template>
  <main class="grid min-h-[60vh] place-items-center p-6">
    <EmptyState
      :icon="ShieldOff"
      title="You don't have access to that page"
      description="Your current persona can't view this surface. Switch personas from the topbar avatar menu — or head back to the dashboard."
    >
      <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button as-child>
          <NuxtLink to="/dashboard">Back to dashboard</NuxtLink>
        </Button>
        <Button as-child variant="outline">
          <NuxtLink to="/">Go home</NuxtLink>
        </Button>
      </div>
    </EmptyState>
  </main>
</template>
