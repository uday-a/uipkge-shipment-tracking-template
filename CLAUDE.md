# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Reference **shipment tracking / logistics** template that consumes the [uipkge](https://uipkge.dev) UI registry. **Not** a real product — it's a client-ready showcase that proves uipkge primitives + blocks work end-to-end in a realistic logistics app. Mock data, mock auth, no backend.

Implication: no bespoke primitives. If a page needs something the registry doesn't have, propose it upstream in uipkge first, then `shadcn-vue add` it here. The `app/components/ui/**` tree is vendored from the registry — extend via wrappers, don't edit in place.

## Common commands

```bash
npm run dev        # http://localhost:3340
npm run build      # production build
npm run generate   # static prerender → .output/public
npx shadcn-vue@latest add @uipkge/<name> -y   # pull a registry primitive/block
```

## Stack quirks worth knowing

- **Nuxt 4** with `components: [{ path: '~/components', pathPrefix: false }]` — `<AppTopbar />` works without folder prefix. Don't add prefixes.
- **Tailwind v4** OKLCH tokens. Use semantic tokens (`text-success`, `bg-warning`), not hardcoded hex (chart series colours are the one exception).
- **shadcn-vue** registry config in `components.json`; `@uipkge` resolves to `https://uipkge.dev/r/{name}.json`.
- **State**: Pinia is **not** wired. Use `useState` + composables.

## SSR-sensitive patterns

Pages render on the server, so server and client must produce identical markup:

- **Mock data is hand-built** (`app/mocks/*.ts`) — no `Math.random`, no `faker`, no `Date.now()` at module scope. The demo "now" is the `TODAY` constant in `app/mocks/shipments.ts`. Adding randomness breaks hydration.
- **Charts** (`vue-echarts`) only run client-side — always wrap chart components in `<ClientOnly>` with a `<Skeleton>` fallback.
- **Theme** lives in a cookie (`useTheme`), not localStorage — server reads it before first HTML.
- **Persona** lives in localStorage (`usePersona`) — sentinel `'admin'` on server, client hydrates from storage. Route guards in `app/middleware/require-*.ts` are client-only (`if (import.meta.server) return`).

## Domain model

The **shipment ledger** (`app/mocks/shipments.ts`) is the source of truth. Other mocks cross-reference it by id:

- `shipment-detail.ts` derives the tracking timeline / packages / docs deterministically from a shipment — no per-row hand-authoring.
- `customers.ts` / `drivers.ts` / `routes.ts` derive live counts from the ledger via helper functions.
- `dashboard.ts` / `analytics.ts` hold aggregate KPIs + chart series (whole-operation scale, larger than the ~45-row ledger).

When adding data, keep ids consistent across files (e.g. a shipment's `driver` must exist in `drivers.ts`).

## Personas

Three: `admin` / `dispatcher` / `customer` (ranked, see `PERSONA_RANK`). `usePersona()` gates UI; `navForPersona()` filters the sidebar; `require-dispatcher` / `require-admin` middleware gate routes. Switch via the topbar avatar menu or Settings → Profile. Persona is the demo's main interactive variable — when adding a screen, decide what each persona sees.

## Layout / chrome

Single layout (`app/layouts/default.vue`) wraps every page in `SidebarProvider` + sidebar + `AppTopbar`. The nav tree is the single source of truth in `app/lib/nav.ts` — add a row there + write the page file. Auth/error pages opt out with `definePageMeta({ layout: false })`.

## Adding a page

1. Add a `NavItem` to `app/lib/nav.ts` (set `requires` for persona gating).
2. Create `app/pages/<route>.vue`.
3. If dispatcher/admin-only, also add `definePageMeta({ middleware: 'require-dispatcher' })`.
4. Reuse `KpiTile`, the chart wrappers, and `DataTable`; pull tones via `toneBadge`/`toneDot` in `app/lib/utils.ts`.
