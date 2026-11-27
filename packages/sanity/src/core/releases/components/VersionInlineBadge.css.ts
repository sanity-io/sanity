import {css} from '#styled-system/css'

const base = css.raw({
  borderRadius: '3px',
  textDecoration: 'none',
  padding: '0px 2px',
  fontWeight: 500,
})

/**
 * The variant banners' chip (with a glyph or `truncate`). The glyph and the name sit inside one
 * box that never breaks: the chip wraps to the next line as a unit, and a name longer than the
 * line truncates with an ellipsis (the full name stays in the DOM, and in the title while it is
 * cut short).
 */
export const versionInlineBadgeChip = css({
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
  // The name is the box's baseline item, so the chip sits on the sentence's baseline
  verticalAlign: 'baseline',
})

/** The chip's glyph (a variant's diamond, a release's mark), centred on the name. */
export const versionInlineBadgeIcon = css({
  display: 'inline-flex',
  alignItems: 'center',
  flex: 'none',
})

/** The chip's name: it gives the chip its baseline and truncates when the chip is at its limit. */
export const versionInlineBadgeName = css({
  alignSelf: 'baseline',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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
