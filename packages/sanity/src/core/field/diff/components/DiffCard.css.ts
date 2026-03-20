import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const bgColorVar = createVar()
export const textColorVar = createVar()
export const diffCardRadiusVar = createVar()
export const diffCardBgColorVar = createVar()

export const styledCard = style({
  selectors: {
    '&&': {
      maxWidth: '100%',
      position: 'relative',
      borderRadius: diffCardRadiusVar,
      backgroundColor: bgColorVar,
      color: textColorVar,
      zIndex: 1,
    },
    '&&:not(del)': {
      textDecoration: 'none',
    },
    '&&[data-hover]::after': {
      content: "''",
      display: 'block',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    '&&[data-hover]:hover': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    '&&[data-hover]:hover::after': {
      bottom: '-3px',
      borderTop: `1px solid ${diffCardBgColorVar}`,
      borderBottom: '2px solid currentColor',
      borderBottomLeftRadius: diffCardRadiusVar,
      borderBottomRightRadius: diffCardRadiusVar,
    },
  },
})

globalStyle(`[data-from-to-layout]:hover .${styledCard}[data-hover]`, {
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
})

globalStyle(`[data-from-to-layout]:hover .${styledCard}[data-hover]::after`, {
  bottom: '-3px',
  borderTop: `1px solid ${diffCardBgColorVar}`,
  borderBottom: '2px solid currentColor',
  borderBottomLeftRadius: diffCardRadiusVar,
  borderBottomRightRadius: diffCardRadiusVar,
})
