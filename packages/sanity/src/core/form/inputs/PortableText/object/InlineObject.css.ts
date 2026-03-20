import {createVar, style} from '@vanilla-extract/css'

export const borderRadiusVar = createVar()
export const focusBorderColorVar = createVar()
export const focusFgColorVar = createVar()
export const selectedBgVar = createVar()
export const hoveredBorderColorVar = createVar()
export const markersBgVar = createVar()
export const warningBgVar = createVar()
export const warningHoverBorderVar = createVar()
export const invalidBgVar = createVar()
export const invalidBorderVar = createVar()
export const invalidHoverBorderVar = createVar()

export const root = style({
  selectors: {
    '&&': {
      lineHeight: 0,
      borderRadius: borderRadiusVar,
      padding: '2px',
      boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
      height: 'calc(1em - 1px)',
      cursor: 'default',
    },
    '&&:not([hidden])': {
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'text-bottom',
      marginInline: '2px',
    },
    '&&[data-ready-only]': {
      cursor: 'default',
    },
    '&&[data-focused]': {
      boxShadow: `inset 0 0 0 1px ${focusBorderColorVar}`,
      color: focusFgColorVar,
    },
    '&&[data-selected]': {
      backgroundColor: selectedBgVar,
    },
    '&&[data-markers]': {
      vars: {
        '--card-bg-color': markersBgVar,
      },
    },
    '&&[data-warning]': {
      vars: {
        '--card-bg-color': warningBgVar,
      },
    },
    '&&[data-invalid]': {
      vars: {
        '--card-bg-color': invalidBgVar,
        '--card-border-color': invalidBorderVar,
      },
    },
  },
})

export const previewSpan = style({
  display: 'block',
  maxWidth: 'calc(5em + 80px)',
  position: 'relative',
})

export const tooltipBox = style({
  selectors: {
    '&&': {
      maxWidth: '250px',
    },
  },
})
