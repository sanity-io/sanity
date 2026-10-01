import {style} from '@vanilla-extract/css'

/**
 * Same slot as `DocumentVersionsStatusIndicator`: `@sanity/ui` Text sizes the
 * 1em glyphs and applies `--card-icon-color`. ui5 `Icon` paints
 * `--foreground-high` and drops the draft orange / published green.
 */
export const iconSlotRoot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  selectors: {
    "&[data-status='published']": {
      vars: {
        '--card-icon-color': 'var(--card-badge-positive-dot-color)',
      },
    },
    "&[data-status='draft']": {
      vars: {
        '--card-icon-color': 'var(--card-badge-caution-dot-color)',
      },
    },
  },
})
