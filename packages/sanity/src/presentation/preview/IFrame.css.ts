import {globalStyle, style} from '@vanilla-extract/css'

export const iframeElement = style({
  boxShadow: '0 0 0 1px var(--card-border-color)',
  border: 0,
  maxHeight: '100%',
  width: '100%',
  viewTransitionClass: 'presentation-tool-iframe' as any,
})

export const iframeOverlay = style({
  selectors: {
    '&&': {
      position: 'absolute',
      inset: 0,
      background: 'transparent',
    },
  },
})
