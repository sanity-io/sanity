import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.button.ghost.neutral.enabled.fg` */
export const ghostNeutralFgVar = createVar()

export const textButton = style({
  all: 'unset',
  display: 'inline-block',
  maxInlineSize: '100%',
  whiteSpace: 'nowrap',
  appearance: 'none',
  border: 0,
  margin: 0,
  padding: 0,
  outline: 'none',
  color: ghostNeutralFgVar,
})

globalStyle(`${textButton}${textButton} *`, {
  color: 'inherit',
})

globalStyle(`${textButton} svg[data-sanity-icon]`, {
  color: 'currentColor',
})
