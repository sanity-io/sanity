import {css} from '#styled-system/css'

const base = css.raw({
  borderRadius: '3px',
  textDecoration: 'none',
  padding: '0px 2px',
  fontWeight: 500,
})

// Keyed by `BadgeTone`; colours are read through the `--card-badge-*` variables the nearest Card
// publishes, so they follow tone and scheme like the original template did. Each tone is spelled
// out (rather than mapped over) so the calls stay statically extractable.
export const versionInlineBadge = {
  default: css(base, {
    color: 'var(--card-badge-default-fg-color)',
    backgroundColor: 'var(--card-badge-default-bg-color)',
  }),
  neutral: css(base, {
    color: 'var(--card-badge-neutral-fg-color)',
    backgroundColor: 'var(--card-badge-neutral-bg-color)',
  }),
  primary: css(base, {
    color: 'var(--card-badge-primary-fg-color)',
    backgroundColor: 'var(--card-badge-primary-bg-color)',
  }),
  suggest: css(base, {
    color: 'var(--card-badge-suggest-fg-color)',
    backgroundColor: 'var(--card-badge-suggest-bg-color)',
  }),
  positive: css(base, {
    color: 'var(--card-badge-positive-fg-color)',
    backgroundColor: 'var(--card-badge-positive-bg-color)',
  }),
  caution: css(base, {
    color: 'var(--card-badge-caution-fg-color)',
    backgroundColor: 'var(--card-badge-caution-bg-color)',
  }),
  critical: css(base, {
    color: 'var(--card-badge-critical-fg-color)',
    backgroundColor: 'var(--card-badge-critical-bg-color)',
  }),
}
