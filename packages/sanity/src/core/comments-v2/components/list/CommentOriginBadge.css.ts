import {globalStyle, style} from '@vanilla-extract/css'

/**
 * Centers draft/published status glyphs beside the origin label. Draft and published slots set
 * `--icon-color` on the svg (ui5 `Icon` shadows an ancestor value) and `--card-icon-color` on the
 * root, same tokens as `DocumentVersionsStatusIndicator`. Glyphs use ui5 `Icon size={2}`, not v4
 * `Text` descendant icon sizing.
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

globalStyle(`${iconSlotRoot}[data-status='published'] svg`, {
  vars: {
    '--icon-color': 'var(--card-badge-positive-dot-color)',
  },
})

globalStyle(`${iconSlotRoot}[data-status='draft'] svg`, {
  vars: {
    '--icon-color': 'var(--card-badge-caution-dot-color)',
  },
})
