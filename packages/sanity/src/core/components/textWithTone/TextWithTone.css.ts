import {css} from '#styled-system/css'

export const textWithTone = css({
  "&:not([data-muted])[data-tone='default']": {
    '--card-fg-color': 'var(--card-badge-default-fg-color)',
  },
  "&:not([data-muted])[data-tone='primary']": {
    '--card-fg-color': 'var(--card-badge-primary-fg-color)',
  },
  "&:not([data-muted])[data-tone='positive']": {
    '--card-fg-color': 'var(--card-badge-positive-fg-color)',
  },
  "&:not([data-muted])[data-tone='caution']": {
    '--card-fg-color': 'var(--card-badge-caution-fg-color)',
  },
  "&:not([data-muted])[data-tone='critical']": {
    '--card-fg-color': 'var(--card-badge-critical-fg-color)',
  },
  '&[data-dimmed]': {
    opacity: 0.3,
  },
})
