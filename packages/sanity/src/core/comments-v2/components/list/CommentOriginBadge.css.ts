import {css} from '#styled-system/css'

/**
 * Centers draft/published status glyphs beside the origin label. Draft and published slots set
 * `--icon-color` on the svg (ui5 `Icon` shadows an ancestor value) and `--card-icon-color` on the
 * root, same tokens as `DocumentVersionsStatusIndicator`.
 */
export const iconSlotRoot = css({
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'flexShrink': 0,
  "&[data-status='published']": {
    '--card-icon-color': 'var(--card-badge-positive-dot-color)',
  },
  "&[data-status='draft']": {
    '--card-icon-color': 'var(--card-badge-caution-dot-color)',
  },
  "&[data-status='published'] svg": {
    '--icon-color': 'var(--card-badge-positive-dot-color)',
  },
  "&[data-status='draft'] svg": {
    '--icon-color': 'var(--card-badge-caution-dot-color)',
  },
})
