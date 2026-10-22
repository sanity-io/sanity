import {css} from '#styled-system/css'

export const iframeElement = css({
  boxShadow: '0 0 0 1px var(--card-border-color)',
  border: 0,
  maxHeight: '100%',
  width: '100%',
  viewTransitionClass: 'presentation-tool-iframe',
})

export const iframeOverlay = css({
  position: 'absolute',
  inset: 0,
  background: 'transparent',
})

// The document-level rules of the iframe's viewport view transitions
// (`html:active-view-transition-type(sanity-iframe-viewport)`) cannot hang off a class of the
// component, so they live in `globalCss` in `packages/sanity/panda.config.ts`.
