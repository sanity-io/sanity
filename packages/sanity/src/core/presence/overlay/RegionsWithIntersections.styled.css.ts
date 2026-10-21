import {createVar, style, type StyleRule, styleVariants} from '@vanilla-extract/css'

export const rootWrapper = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
})

export const contentWrapper = style({
  flex: '1 1 auto',
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

const regionWrapper: StyleRule = {
  overflow: ['hidden', 'clip'],
  pointerEvents: 'none',
  position: 'absolute',
}

/** `${margins[0] - 1}px`; left unset (`top: auto`) when no `margins` are passed */
export const topVar = createVar()

const topRegion = style({
  ...regionWrapper,
  zIndex: 100,
  position: ['absolute', 'sticky'],
  flex: 'none',
  height: '1px',
  top: topVar,
})

export const topRegionWrapper = styleVariants({
  default: [topRegion, {backgroundColor: 'transparent'}],
  debug: [topRegion, {backgroundColor: 'red'}],
})

const middleRegion = style(regionWrapper)

export const middleRegionWrapper = styleVariants({
  default: [middleRegion],
  debug: [
    middleRegion,
    {
      background: 'rgba(255, 0, 0, 0.25)',
      outline: '1px solid #00b',
      visibility: 'visible',
    },
  ],
})

const bottomRegion = style({
  ...regionWrapper,
  position: ['absolute', 'sticky'],
  flex: 'none',
  bottom: '-1px',
  height: '1px',
})

export const bottomRegionWrapper = styleVariants({
  default: [bottomRegion, {backgroundColor: 'transparent'}],
  debug: [bottomRegion, {backgroundColor: 'blue'}],
})
