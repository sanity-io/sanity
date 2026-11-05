import {css} from '#styled-system/css'

export const customTextInputBox = css({
  'width': '100%',
  // Same (0,2,1) specificity as the original `.root [data-qa='clear-button']`: beats the Button's
  // base and `:not([data-disabled])` rules, but not its `:focus` box-shadow rules.
  "& [data-qa='clear-button']": {
    background: 'none',
    boxShadow: 'none',
    display: 'flex',
    /* TODO: hack, currently used to vertically center <TextInput>'s clearButton */
    transform: 'scale(1)',
  },
  "& [data-qa='clear-button']:hover": {
    opacity: 0.5,
  },
})

/**
 * Applied when `$background` is falsy. When `$background` is truthy the legacy
 * `theme.sanity.color.card.disabled.bg2` value was read, which no studio theme defines, so the
 * declaration was dropped and TextInput's presentation span kept its own background.
 */
export const transparentInputBackground = css({
  '& input + span': {
    background: 'transparent',
  },
})

// Follows `customTextInputBox` on the same element; `&&` keeps its transform winning
export const smallClearButton = css({
  "&& [data-qa='clear-button']": {
    transform: 'scale(0.8)',
  },
})
