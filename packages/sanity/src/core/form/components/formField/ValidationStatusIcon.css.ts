import {css} from '#styled-system/css'

export const errorIcon = css({
  '&&': {
    '--card-icon-color': 'var(--card-badge-critical-icon-color)',
    '--icon-color': 'var(--card-badge-critical-icon-color)',
  },
})

export const warningIcon = css({
  '&&': {
    '--card-icon-color': 'var(--card-badge-caution-icon-color)',
    '--icon-color': 'var(--card-badge-caution-icon-color)',
  },
})

export const infoIcon = css({
  '&&': {
    '--card-icon-color': 'var(--card-badge-primary-icon-color)',
    '--icon-color': 'var(--card-badge-primary-icon-color)',
  },
})
