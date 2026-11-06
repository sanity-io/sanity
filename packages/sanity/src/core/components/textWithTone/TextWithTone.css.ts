import {css} from '#styled-system/css'

export const textWithTone = css({
  "&:not([data-muted])[data-tone='default']": {
    '--text-color': 'var(--card-badge-default-fg-color)',
  },
  "&:not([data-muted])[data-tone='primary']": {
    '--text-color': 'var(--card-badge-primary-fg-color)',
  },
  "&:not([data-muted])[data-tone='positive']": {
    '--text-color': 'var(--card-badge-positive-fg-color)',
  },
  "&:not([data-muted])[data-tone='caution']": {
    '--text-color': 'var(--card-badge-caution-fg-color)',
  },
  "&:not([data-muted])[data-tone='critical']": {
    '--text-color': 'var(--card-badge-critical-fg-color)',
  },
  '&[data-dimmed]': {
    opacity: 0.3,
  },
})
