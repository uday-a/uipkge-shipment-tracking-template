# AGENTS.md

## Stack quirks

- **Nuxt 4**: `components: [{ path: '~/components', pathPrefix: false }]` — import `<AppTopbar />` without folder prefix. Pattern `**/*.vue` prevents duplicate auto-imports from index.ts re-exports.
- **shadcn-vue registry**: `@uipkge` resolves to `https://uipkge.dev/r/{name}.json`. Use `npx shadcn-vue@latest add @uipkge/<name> -y`.
- **Tailwind v4**: OKLCH tokens. Use semantic classes (`text-success`, `bg-warning`). Charts are the only exception for hardcoded colors.
- **No Pinia**: Use `useState` + composables. State is SSR-safe.

## SSR-sensitive patterns

- Mock data: deterministic only. No `Math.random`, `faker`, or `Date.now()` at module scope. Demo date = `TODAY` constant in `app/mocks/shipments.ts`.
- Charts (`vue-echarts`): client-side only → wrap in `<ClientOnly>` with `<Skeleton>` fallback.
- Theme: cookie-based (`useTheme`) → server reads before HTML.
- Persona: localStorage (`usePersona`) → sentinel `'admin'` on server, hydrates on client. Middleware has early return `if (import.meta.server) return`.

## Domain model

- **SHIPMENTS** (`app/mocks/shipments.ts`) is the ledger. Other mocks cross-reference by id.
- `shipment-detail.ts` derives timeline/packages/docs deterministically — no per-row authoring.
- `customers.ts`/`drivers.ts`/`routes.ts` derive counts via helpers.
- Keep ids consistent across mock files.

## Personas

- `admin` (rank 2) > `dispatcher` (rank 1) > `customer` (rank 0).
- Switch via topbar avatar menu or Settings → Profile.
- Guards use `isDispatcher`/`isAdmin` computed values.

## Layout

- Single layout: `app/layouts/default.vue` wraps pages in `SidebarProvider` + `Sidebar02` + `AppTopbar`.
- Auth/error pages opt out: `definePageMeta({ layout: false })`.

## Adding a page

1. Add `NavItem` to `app/lib/nav.ts` (optional `requires` for persona gating).
2. Create `app/pages/<route>.vue`.
3. If dispatcher/admin-only: `definePageMeta({ middleware: 'require-dispatcher' })`.
4. Reuse `KpiTile`, chart wrappers, `DataTable`. Use `toneBadge`/`toneDot` from `app/lib/utils.ts`.

## Commands

```bash
npm run dev       # localhost:3340
npm run build     # production
npm run generate  # static prerender
```