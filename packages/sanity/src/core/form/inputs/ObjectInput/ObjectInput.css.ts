import {createVar, style} from '@vanilla-extract/css'

export const rootStack = style({
  /* Disable focus ring for the object block. We instead highlight the left border on the fieldset
  for level > 0 to signal that you have focused on the object */
  selectors: {
    '&:focus': {
      outline: 'none',
    },
  },
})

// `$level`-dependent theme reads (`space[5] * -1`, `space[4]`), set by the wrapper
export const fieldGroupTabsWrapperMarginBottomVar = createVar()
export const fieldGroupTabsWrapperPaddingBottomVar = createVar()

// The negative margins here removes the extra space between the tabs and the fields when inside of a grid
export const fieldGroupTabsWrapper = style({
  selectors: {
    // `&&`: Card (through Box) sets `margin: 0` and `padding: 0` itself
    '&&': {
      marginBottom: fieldGroupTabsWrapperMarginBottomVar,
      paddingBottom: fieldGroupTabsWrapperPaddingBottomVar,
    },
  },
})

export const alignedBottomGrid = style({
  alignItems: 'flex-end',
})
