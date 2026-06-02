/**
 * Sidebar navigation tree. Single source of truth — used by the sidebar
 * block for rendering and by AppBreadcrumb for "where am I" lookups.
 * Adding a page means: drop a row here + write the page file. The persona
 * filter happens at render time.
 *
 * Order here is the order the sidebar renders. Section labels split
 * groups. `requires` restricts a row to a persona level (or higher).
 */
import type { Persona } from '~/composables/usePersona'
import { PERSONA_RANK } from '~/composables/usePersona'

export interface NavItem {
  label: string
  to?: string
  icon?: string
  requires?: Persona
  children?: NavItem[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Shipments', to: '/shipments', icon: 'Package' },
      { label: 'New shipment', to: '/shipments/new', icon: 'PackagePlus', requires: 'dispatcher' },
      { label: 'Track a package', to: '/tracking', icon: 'Search' },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { label: 'Vehicles', to: '/fleet', icon: 'Truck', requires: 'dispatcher' },
      { label: 'Drivers', to: '/drivers', icon: 'IdCard', requires: 'dispatcher' },
    ],
  },
  {
    label: 'Network',
    items: [
      { label: 'Routes', to: '/routes', icon: 'Route', requires: 'dispatcher' },
      { label: 'Warehouses', to: '/warehouses', icon: 'Warehouse', requires: 'dispatcher' },
    ],
  },
  {
    label: 'Customers',
    items: [{ label: 'Accounts', to: '/customers', icon: 'Building2', requires: 'dispatcher' }],
  },
  {
    label: 'Insights',
    items: [{ label: 'Analytics', to: '/analytics', icon: 'BarChart3', requires: 'dispatcher' }],
  },
  {
    label: 'Settings',
    items: [{ label: 'Workspace', to: '/settings', icon: 'Settings' }],
  },
]

/** Walks NAV + returns the matching item for a given path (or null). */
export function findNavItem(path: string): NavItem | null {
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.to === path) return item
    }
  }
  return null
}

/** Filters NAV to only items the given persona can see. */
export function navForPersona(persona: Persona): NavSection[] {
  return NAV.map((section) => ({
    label: section.label,
    items: section.items.filter((item) => {
      if (!item.requires) return true
      return PERSONA_RANK[persona] >= PERSONA_RANK[item.requires]
    }),
  })).filter((section) => section.items.length > 0)
}
