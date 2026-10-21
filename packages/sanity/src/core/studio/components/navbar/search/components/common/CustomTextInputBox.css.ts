import {globalStyle, style} from '@vanilla-extract/css'

export const customTextInputBox = style({
  width: '100%',
})

export const transparentInputBackground = style({})

globalStyle(`${transparentInputBackground} input + span`, {
  background: 'transparent',
})

globalStyle(`${customTextInputBox} [data-qa='clear-button']`, {
  background: 'none',
  boxShadow: 'none',
  display: 'flex' /* TODO: hack, currently used to vertically center <TextInput>'s clearButton */,
  transform: 'scale(1)',
})

export const smallClearButton = style({})

globalStyle(`${smallClearButton} [data-qa='clear-button']`, {
  transform: 'scale(0.8)',
})

globalStyle(`${customTextInputBox} [data-qa='clear-button']:hover`, {
  opacity: 0.5,
})
