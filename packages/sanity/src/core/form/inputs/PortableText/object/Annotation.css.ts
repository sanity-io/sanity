import {createVar, style} from '@vanilla-extract/css'

export const bgColorVar = createVar()
export const fgColorVar = createVar()
export const linkBorderVar = createVar()
export const customMarkersBgVar = createVar()
export const warningBgVar = createVar()
export const errorBgVar = createVar()

export const root = style({
  textDecoration: 'none',
  display: 'inline',
  backgroundColor: bgColorVar,
  borderBottom: `1px dashed ${fgColorVar}`,
  color: fgColorVar,
  selectors: {
    '&[data-link]': {
      borderBottom: `1px solid ${fgColorVar}`,
    },
    '&[data-custom-markers]': {
      backgroundColor: customMarkersBgVar,
    },
    '&[data-warning]': {
      backgroundColor: warningBgVar,
    },
    '&[data-error]': {
      backgroundColor: errorBgVar,
    },
  },
})

export const tooltipBox = style({
  selectors: {
    '&&': {
      maxWidth: '250px',
    },
  },
})
