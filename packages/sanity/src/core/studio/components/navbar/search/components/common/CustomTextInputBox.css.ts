import {globalStyle, style} from '@vanilla-extract/css'

export const customTextInputBox = style({
  width: '100%',
})

/**
 * Applied when `$background` is falsy. When `$background` is truthy the legacy
 * `theme.sanity.color.card.disabled.bg2` value was read, which no studio theme defines, so the
 * declaration was dropped and TextInput's presentation span kept its own background.
 */
export const transparentInputBackground = style({})

globalStyle(`${transparentInputBackground} input + span`, {
  background: 'transparent',
})

// Same (0,2,1) specificity as the original `.root [data-qa='clear-button']`: beats the Button's
// base and `:not([data-disabled])` rules, but not its `:focus` box-shadow rules.
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
