/**
 * Persona / permission state.
 *
 * Three personas frame what a logistics product asks the UI to do:
 *   - admin       -- operations admin. Sees everything (default in demo):
 *                    every shipment, the full fleet, drivers, routes,
 *                    warehouses, customers, analytics, and workspace admin.
 *   - dispatcher  -- runs day-to-day operations. Shipments, fleet, drivers,
 *                    routes, warehouses, customers, analytics — but not the
 *                    workspace-admin "Team & roles" surface.
 *   - customer    -- an external shipper. Their own shipments + the public
 *                    tracking lookup only. No fleet, no network, no analytics.
 *
 * Persisted in localStorage on the client so a refresh doesn't bounce
 * the demo back to admin. Sentinel default on the server (no localStorage).
 *
 * In a real product these gates would come from the auth provider's
 * claims; here we keep them deliberately client-side so the template
 * stays mock-only. useState gives SSR-safe shared state; a client-side
 * watcher syncs to localStorage.
 */
export type Persona = 'admin' | 'dispatcher' | 'customer'

export const PERSONA_LABELS: Record<Persona, string> = {
  admin: 'Operations Admin',
  dispatcher: 'Dispatcher',
  customer: 'Customer',
}

/** Rank used by nav gating + page middleware. Higher sees more. */
export const PERSONA_RANK: Record<Persona, number> = {
  customer: 0,
  dispatcher: 1,
  admin: 2,
}

const STORAGE_KEY = 'uipkge-shiptrack:persona'

export function usePersona() {
  const current = useState<Persona>('persona', () => 'admin')

  if (import.meta.client) {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Persona | null
    if (stored && ['admin', 'dispatcher', 'customer'].includes(stored)) {
      current.value = stored
    }
    watch(current, (v) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, v)
      } catch {
        // Quota exceeded or private mode -- silently degrade.
      }
    })
  }

  const set = (p: Persona) => {
    current.value = p
  }

  const can = (required: Persona) => PERSONA_RANK[current.value] >= PERSONA_RANK[required]

  const isAdmin = computed(() => current.value === 'admin')
  const isDispatcher = computed(() => can('dispatcher'))

  return { current, set, can, isAdmin, isDispatcher }
}
