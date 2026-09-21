import {createVar, globalStyle, style} from '@vanilla-extract/css'

// color.input.default.enabled.placeholder
export const placeholderColorVar = createVar()
// space[1]
export const space1Var = createVar()
// radius[3]
export const radius3Var = createVar()

export const placeholderWrapper = style({
  color: placeholderColorVar,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textWrap: 'nowrap',
  display: 'block',
})

export const popover = style({
  selectors: {
    "&[data-placement='bottom']": {
      transform: `translateY(${space1Var})`,
    },

    "&[data-placement='top']": {
      transform: `translateY(calc(-1 * ${space1Var}))`,
    },
  },
})

globalStyle(`${popover} [data-ui='Popover__wrapper']`, {
  borderRadius: radius3Var,
  display: 'flex',
  flexDirection: 'column',
  overflow: ['clip', 'hidden'],
  position: 'relative',
  width: '300px', // todo: improve
})
