import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const placeholderColorVar = createVar()

export const placeholderWrapper = style({
  color: placeholderColorVar,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textWrap: 'nowrap',
  display: 'block',
})

export const spaceVar = createVar()
export const radiusVar = createVar()

export const styledPopover = style({
  selectors: {
    '&&[data-placement="bottom"]': {
      transform: `translateY(${spaceVar})`,
    },
    '&&[data-placement="top"]': {
      transform: `translateY(calc(-1 * ${spaceVar}))`,
    },
  },
})

globalStyle(`${styledPopover} [data-ui='Popover__wrapper']`, {
  borderRadius: radiusVar,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'clip',
  position: 'relative',
  width: '300px', // todo: improve
})
