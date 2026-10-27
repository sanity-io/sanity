import {css} from '#styled-system/css'

export const iconSlotRoot = css({
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'width': '15px',
  'flexShrink': 0,
  "&[data-status='published']": {
    '--card-icon-color': 'var(--card-badge-positive-dot-color)',
  },
  "&[data-status='draft']": {
    '--card-icon-color': 'var(--card-badge-caution-dot-color)',
  },
  "&[data-status='variant']": {
    '--card-icon-color': 'var(--card-badge-suggest-dot-color)',
  },
  // ui5 `Icon` re-declares `--icon-color` on its svg, shadowing an ancestor value
  "&[data-status='published'] svg": {
    '--icon-color': 'var(--card-badge-positive-dot-color)',
  },
  "&[data-status='draft'] svg": {
    '--icon-color': 'var(--card-badge-caution-dot-color)',
  },
  "&[data-status='variant'] svg": {
    '--icon-color': 'var(--card-badge-suggest-dot-color)',
  },
  '& svg': {
    flexShrink: 0,
  },
})
