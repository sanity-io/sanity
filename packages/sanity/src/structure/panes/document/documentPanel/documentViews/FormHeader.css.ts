import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const headingSize4FontSizeVar = createVar()
export const headingSize4LineHeightVar = createVar()
export const headingSize3FontSizeVar = createVar()
export const headingSize3LineHeightVar = createVar()
export const headingSize2FontSizeVar = createVar()
export const headingSize2LineHeightVar = createVar()

/**
 * Use CSS container queries to conditionally render headings at different sizes.
 * We hide this entire container (including the document type) if container queries
 * not supported in the current browser.
 */
export const titleContainer = style({
  'containerType': 'inline-size',
  '@supports': {
    'not (container-type: inline-size)': {
      // Pre-existing `!important`, copied verbatim: Stack's own `&&:not([hidden]) {display: grid}`
      // rule has (0,3,0) specificity, which a plain class cannot beat.
      display: 'none !important',
    },
  },
})

globalStyle(`${titleContainer} [data-heading]`, {
  'fontSize': headingSize4FontSizeVar,
  'lineHeight': headingSize4LineHeightVar,
  'overflowWrap': 'break-word',
  'textWrap': 'pretty',
  '@container': {
    '(max-width: 560px)': {
      fontSize: headingSize3FontSizeVar,
      lineHeight: headingSize3LineHeightVar,
    },
    '(max-width: 420px)': {
      fontSize: headingSize2FontSizeVar,
      lineHeight: headingSize2LineHeightVar,
    },
  },
})
