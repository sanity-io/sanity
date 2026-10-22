import {css} from '#styled-system/css'

export const headingSize4FontSizeVar = '--form-header-heading-size-4-font-size'
export const headingSize4LineHeightVar = '--form-header-heading-size-4-line-height'
export const headingSize3FontSizeVar = '--form-header-heading-size-3-font-size'
export const headingSize3LineHeightVar = '--form-header-heading-size-3-line-height'
export const headingSize2FontSizeVar = '--form-header-heading-size-2-font-size'
export const headingSize2LineHeightVar = '--form-header-heading-size-2-line-height'

/**
 * Use CSS container queries to conditionally render headings at different sizes.
 * We hide this entire container (including the document type) if container queries
 * not supported in the current browser.
 */
export const titleContainer = css({
  'containerType': 'inline-size',
  '@supports not (container-type: inline-size)': {
    // `&&&` (0,3,0) outranks Flex's own (0,2,0) `.sui-display-flex:not([hidden])` rule
    '&&&': {
      display: 'none',
    },
  },
  '& [data-heading]': {
    'fontSize': `var(${headingSize4FontSizeVar})`,
    'lineHeight': `var(${headingSize4LineHeightVar})`,
    'overflowWrap': 'break-word',
    'textWrap': 'pretty',
    '@container (max-width: 560px)': {
      fontSize: `var(${headingSize3FontSizeVar})`,
      lineHeight: `var(${headingSize3LineHeightVar})`,
    },
    '@container (max-width: 420px)': {
      fontSize: `var(${headingSize2FontSizeVar})`,
      lineHeight: `var(${headingSize2LineHeightVar})`,
    },
  },
})
