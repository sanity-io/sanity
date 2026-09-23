import {style, styleVariants} from '@vanilla-extract/css'

const base = style({
  borderRadius: '3px',
  textDecoration: 'none',
  padding: '0px 2px',
  fontWeight: 500,
})

// Keyed by `BadgeTone`; colours are read through the `--card-badge-*` variables the nearest Card
// publishes, so they follow tone and scheme like the original template did.
export const versionInlineBadge = styleVariants(
  {
    default: 'default',
    neutral: 'neutral',
    primary: 'primary',
    suggest: 'suggest',
    positive: 'positive',
    caution: 'caution',
    critical: 'critical',
  },
  (tone) => [
    base,
    {
      color: `var(--card-badge-${tone}-fg-color)`,
      backgroundColor: `var(--card-badge-${tone}-bg-color)`,
    },
  ],
)
