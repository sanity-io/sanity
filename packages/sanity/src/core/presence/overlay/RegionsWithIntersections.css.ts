import {style} from '@vanilla-extract/css'

export const rootWrapper = style({
  position: 'relative',
})

export const overlayWrapper = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 13,
})

const regionWrapper = {
  overflow: 'clip' as const,
  pointerEvents: 'none' as const,
  position: 'absolute' as const,
}

export const topRegionWrapper = style({
  ...regionWrapper,
  zIndex: 100,
  position: 'sticky',
  height: '1px',
})

export const topRegionWrapperDebug = style({
  backgroundColor: 'red',
})

export const middleRegionWrapper = style({
  ...regionWrapper,
  visibility: 'hidden',
})

export const middleRegionWrapperDebug = style({
  background: 'rgba(255, 0, 0, 0.25)',
  outline: '1px solid #00b',
  visibility: 'visible',
})

export const bottomRegionWrapper = style({
  ...regionWrapper,
  position: 'sticky',
  bottom: '-1px',
  height: '1px',
  backgroundColor: 'transparent',
})

export const bottomRegionWrapperDebug = style({
  backgroundColor: 'blue',
})
