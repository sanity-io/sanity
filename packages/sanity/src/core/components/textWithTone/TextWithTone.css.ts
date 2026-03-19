import {style} from '@vanilla-extract/css'

import {referenceLinkCard} from '../../form/inputs/ReferenceInput/ReferenceLinkCard.css'

export const textWithTone = style({
  selectors: {
    '&&:not([data-muted])[data-tone="default"]': {
      vars: {'--card-fg-color': 'var(--card-badge-default-fg-color)'},
    },
    '&&:not([data-muted])[data-tone="primary"]': {
      vars: {'--card-fg-color': 'var(--card-badge-primary-fg-color)'},
    },
    '&&:not([data-muted])[data-tone="positive"]': {
      vars: {'--card-fg-color': 'var(--card-badge-positive-fg-color)'},
    },
    '&&:not([data-muted])[data-tone="caution"]': {
      vars: {'--card-fg-color': 'var(--card-badge-caution-fg-color)'},
    },
    '&&:not([data-muted])[data-tone="critical"]': {
      vars: {'--card-fg-color': 'var(--card-badge-critical-fg-color)'},
    },
    '&&[data-dimmed]': {
      opacity: 0.3,
    },
    [`${referenceLinkCard}[data-selected] &`]: {
      color: 'inherit',
    },
    [`${referenceLinkCard}[data-pressed] &`]: {
      color: 'inherit',
    },
    [`${referenceLinkCard}:active &`]: {
      color: 'inherit',
    },
  },
})
