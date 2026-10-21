import {style} from '@vanilla-extract/css'

/** Tab plus the validation icon beside it, so the icon is not nested in the tab button. */
export const groupTab = style({
  alignItems: 'center',
  display: 'inline-flex',
})

/** Click target for the validation icon drawn beside a field group tab. */
export const groupValidationIcon = style({
  alignItems: 'center',
  appearance: 'none',
  background: 'transparent',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  display: 'inline-flex',
  margin: 0,
  padding: 0,
})
