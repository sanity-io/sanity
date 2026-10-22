import {css} from '#styled-system/css'

export const rootStack = css({
  /* Disable focus ring for the object block. We instead highlight the left border on the fieldset
  for level > 0 to signal that you have focused on the object */
  '&:focus': {
    outline: 'none',
  },
})

// `$level`-dependent theme reads (`space[5] * -1`, `space[4]`), set by the wrapper
export const fieldGroupTabsWrapperMarginBottomVar =
  '--object-input-field-group-tabs-wrapper-margin-bottom'
export const fieldGroupTabsWrapperPaddingBottomVar =
  '--object-input-field-group-tabs-wrapper-padding-bottom'

// The negative margins here removes the extra space between the tabs and the fields when inside of a grid
export const fieldGroupTabsWrapper = css({
  // `&&`: Card (through Box) sets `margin: 0` and `padding: 0` itself
  '&&': {
    marginBottom: `var(${fieldGroupTabsWrapperMarginBottomVar})`,
    paddingBottom: `var(${fieldGroupTabsWrapperPaddingBottomVar})`,
  },
})

export const alignedBottomGrid = css({
  // `&&` outranks the Grid's `.sui-align-items-*` utility classes, as the styled rule did
  '&&': {
    alignItems: 'flex-end',
  },
})
