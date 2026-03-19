import {style, globalStyle, styleVariants} from '@vanilla-extract/css'

const base = style({
  width: '100%',
})

export const customTextInputBox = styleVariants({
  default: [base],
  background: [base],
  smallClear: [base],
  backgroundSmallClear: [base],
})

// input + span background styles
globalStyle(`.${customTextInputBox.background} input + span, .${customTextInputBox.backgroundSmallClear} input + span`, {
  background: 'var(--card-disabled-bg2-color, transparent)',
})

globalStyle(`.${customTextInputBox.default} input + span, .${customTextInputBox.smallClear} input + span`, {
  background: 'transparent',
})

// Clear button styles
const clearButtonBase = {
  background: 'none',
  boxShadow: 'none',
  display: 'flex',
}

globalStyle(`.${base} [data-qa='clear-button']`, {
  ...clearButtonBase,
  transform: 'scale(1)',
})

globalStyle(`.${customTextInputBox.smallClear} [data-qa='clear-button'], .${customTextInputBox.backgroundSmallClear} [data-qa='clear-button']`, {
  ...clearButtonBase,
  transform: 'scale(0.8)',
})

globalStyle(`.${base} [data-qa='clear-button']:hover`, {
  opacity: 0.5,
})
