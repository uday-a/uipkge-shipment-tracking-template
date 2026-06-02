import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

/**
 * Variant definitions live in their own file (rather than the package
 * `index.ts`) so consuming Vue SFCs can import without creating a circular
 * dependency through the index. See card.variants.ts for the canonical
 * example + the SSR symptom that motivated the split.
 */

export const chipVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-full text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground hover:bg-muted/80',
        filled: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outlined: 'border border-current bg-transparent hover:bg-accent',
        elevated: 'bg-primary/10 text-primary shadow-sm hover:bg-primary/20',
        success: 'bg-[var(--success)]/10 text-[var(--success)] dark:text-[var(--success)] hover:bg-[var(--success)]/20',
        warning: 'bg-[var(--warning)]/10 text-[var(--warning)] dark:text-[var(--warning)] hover:bg-[var(--warning)]/20',
        destructive: 'bg-destructive/10 text-destructive dark:text-destructive hover:bg-destructive/20',
      },
      size: {
        sm: 'h-6 px-2 text-xs',
        default: 'h-7 px-2.5 text-xs',
        lg: 'h-8 px-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ChipVariants = VariantProps<typeof chipVariants>
