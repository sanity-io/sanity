import {globalStyle, style} from '@vanilla-extract/css'

export const iframeElement = style({
  boxShadow: '0 0 0 1px var(--card-border-color)',
  border: 0,
  maxHeight: '100%',
  width: '100%',
  viewTransitionClass: 'presentation-tool-iframe',
})

export const iframeOverlay = style({
  position: 'absolute',
  inset: 0,
  background: 'transparent',
})

globalStyle('html:active-view-transition-type(sanity-iframe-viewport)', {
  viewTransitionName: 'none',
})

globalStyle('html:active-view-transition-type(sanity-iframe-viewport)::view-transition', {
  pointerEvents: 'none',
})

/* globalStyle('html:active-view-transition-type(sanity-iframe-viewport)::view-transition-old(root)', {
  display: 'none',
})
globalStyle('html:active-view-transition-type(sanity-iframe-viewport)::view-transition-new(root)', {
  animation: 'none',
}) */
