import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const headingSize4FontSize = createVar()
export const headingSize4LineHeight = createVar()
export const headingSize3FontSize = createVar()
export const headingSize3LineHeight = createVar()
export const headingSize2FontSize = createVar()
export const headingSize2LineHeight = createVar()

export const titleContainer = style({
  selectors: {
    '&&': {
      containerType: 'inline-size',
    },
  },
  '@supports': {
    'not (container-type: inline-size)': {
      display: 'none !important',
    },
  },
})

globalStyle(`${titleContainer} [data-heading]`, {
  fontSize: headingSize4FontSize,
  lineHeight: headingSize4LineHeight,
  overflowWrap: 'break-word',
  textWrap: 'pretty',
  '@container': {
    '(max-width: 560px)': {
      fontSize: headingSize3FontSize,
      lineHeight: headingSize3LineHeight,
    },
    '(max-width: 420px)': {
      fontSize: headingSize2FontSize,
      lineHeight: headingSize2LineHeight,
    },
  },
} as any)
