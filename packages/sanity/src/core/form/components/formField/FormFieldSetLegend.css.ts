import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const rootLegend = style({
  /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
  padding: '0',
  display: 'table',
})

export const borderRadiusVar = createVar()
export const focusBoxShadowVar = createVar()

export const toggleButton = style({
  selectors: {
    '&&': {
      appearance: 'none',
      border: '0',
      background: 'none',
      color: 'inherit',
      WebkitFontSmoothing: 'inherit',
      font: 'inherit',
      outline: 'none',
      borderRadius: borderRadiusVar,
      position: 'relative',
    },
    '&&:not([hidden])': {
      display: 'flex',
    },
    '&&:focus': {
      boxShadow: focusBoxShadowVar,
    },
    '&&:focus:not(:focus-visible)': {
      boxShadow: 'none',
    },
  },
})

/* Added to increase the hit area of the collapsible fieldset */
globalStyle(`${toggleButton}::after`, {
  content: "''",
  position: 'absolute',
  top: '-10px',
  right: '-10px',
  bottom: '-10px',
  left: '-10px',
})

export const toggleIconBox = style({
  selectors: {
    '&&': {
      width: '9px',
      height: '9px',
      marginRight: '3px',
    },
  },
})

globalStyle(`${toggleIconBox} svg`, {
  transition: 'transform 100ms',
})
