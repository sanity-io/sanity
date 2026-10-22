import {css} from '#styled-system/css'

/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = '--assignee-create-form-field-input-placeholder-color'

export const focusableCard = css({
  // Card sets `border: 0` on `&[data-as='button']` (0,2,0); the styled() wrapper only won by
  // injection order, so the border override needs one more class.
  "&&[data-as='button']": {
    'border': '1px solid var(--card-border-color)',
    '--card-muted-fg-color': `var(${inputPlaceholderColorVar})`,
  },
  "&&[data-as='button']:focus-within": {
    border: '1px solid var(--card-focus-ring-color)',
  },
  // Set on the Text itself: it defines both variables, so values inherited from the card never apply
  "&&[data-as='button'][data-selected] [data-ui='Text']": {
    '--text-color-muted': 'light-dark(var(--blue-200), var(--blue-800))',
    '--text-color': 'light-dark(var(--white), var(--black))',
  },
})
