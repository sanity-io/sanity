import {createVar, style, type StyleRule, styleVariants} from '@vanilla-extract/css'

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

// Shared `RegionWrapper` mixin. `overflow: clip` was declared after `overflow: hidden` as a
// fallback chain, which the array reproduces.
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
  // the mixin's `position: absolute` stayed in the rule as a fallback for `sticky`
  position: ['absolute', 'sticky'],
  height: '1px',
  top: topVar,
})

export const topRegionWrapper = styleVariants({
  // the non-debug branch declared `background-color: none`, an invalid value browsers drop
  default: [topRegion],
  debug: [topRegion, {backgroundColor: 'red'}],
})

// the original also declared `visibility: none`, an invalid value browsers drop
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
  bottom: '-1px',
  height: '1px',
})

export const bottomRegionWrapper = styleVariants({
  default: [bottomRegion, {backgroundColor: 'transparent'}],
  debug: [bottomRegion, {backgroundColor: 'blue'}],
})
