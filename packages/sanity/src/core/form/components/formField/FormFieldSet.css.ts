import {css} from '#styled-system/css'

export const root = css({
  'border': 'none',
  /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
  'body:not(:-moz-handler-blocked) &': {
    display: 'table-cell',
  },
})

export const contentFocusRingVar = '--form-field-set-content-focus-ring'

export const content = css({
  'outline': 'none',
  'transition': 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:focus': {
    boxShadow: `var(${contentFocusRingVar})`,
  },
  '&:focus:not(:focus-visible)': {
    boxShadow: 'none',
  },
})

export const contentBorderLeft = css({
  borderLeft: '1px solid var(--card-border-color)',
  boxShadow: 'inset 0 0 0 transparent',
})

export const contentBorderLeftFocused = css({
  borderLeft: '1px solid var(--card-focus-ring-color)',
  boxShadow: 'inset 1px 0 0 var(--card-focus-ring-color)',
})

/* Anchors the collapsible legend's hit area (see FormFieldSetLegend) to the whole row */
export const headerRow = css({
  position: 'relative',
})

/* Keeps interactive header items above the legend's hit area */
export const headerRowItem = css({
  position: 'relative',
})
