import {css} from '#styled-system/css'
import {type SystemStyleObject} from '#styled-system/types'

export const root = css({
  /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
  padding: 0,
  display: 'table',
})

export const toggleButtonRadiusVar = '--form-field-set-legend-toggle-button-radius'
export const toggleButtonFocusRingVar = '--form-field-set-legend-toggle-button-focus-ring'

// `-webkit-font-smoothing` is not among the properties Panda types
const fontSmoothingInherit = {WebkitFontSmoothing: 'inherit'} as SystemStyleObject

export const toggleButton = css(fontSmoothingInherit, {
  'appearance': 'none',
  'border': 0,
  'background': 'none',
  'color': 'inherit',
  'font': 'inherit',
  'outline': 'none',
  'borderRadius': `var(${toggleButtonRadiusVar})`,
  '&:not([hidden])': {
    display: 'flex',
  },
  '&:focus': {
    boxShadow: `var(${toggleButtonFocusRingVar})`,
  },
  '&:focus:not(:focus-visible)': {
    boxShadow: 'none',
  },
  /*
   * Stretches the hit area over the closest positioned ancestor (the fieldset header row), so
   * the whole row toggles. Interactive siblings in that row need "position: relative" to stay
   * above it.
   */
  '&::after': {
    content: "''",
    position: 'absolute',
    top: '-10px',
    right: 0,
    bottom: '-10px',
    left: '-10px',
  },
})

export const toggleIconBox = css({
  // Box sets width, height and margin on itself
  '&&': {
    width: '9px',
    height: '9px',
    marginRight: '3px',
  },
  '& svg': {
    transition: 'transform 100ms',
  },
})
