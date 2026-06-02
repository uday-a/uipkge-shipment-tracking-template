import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: [
    '@fontsource-variable/inter',
    '@fontsource/dm-mono/400.css',
    '@fontsource/dm-mono/500.css',
    '~/assets/css/main.css',
    'leaflet/dist/leaflet.css',
  ],
  components: [
    // Allow `<AppTopbar />` etc. without the folder prefix. The Nuxt 4
    // default (`pathPrefix: true`) would have required `<NavAppTopbar />`,
    // which doesn't match the layout's component refs.
    //
    // `pattern: '**/*.vue'` restricts the scan to .vue files so per-dir
    // `index.ts` re-exports and `context.ts` helpers stop registering as
    // duplicate auto-imports (was causing "Two component files resolving
    // to the same name" warnings on Textarea / Timeline / Tooltip / Context).
    { path: '~/components', pathPrefix: false, pattern: '**/*.vue' },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'ShipTrack — Shipment Tracking template on Vue 3 + Nuxt 4',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      meta: [
        { name: 'description', content: 'Reference shipment-tracking & logistics template built end-to-end on the uipkge UI registry. Mock data, mock auth — copy any page as a starting point.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { property: 'og:title', content: 'ShipTrack — shipment tracking reference template' },
        { property: 'og:type', content: 'website' },
      ],
    },
  },
})
