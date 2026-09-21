import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `${theme.radius[3]}px`, set by `StyledPopover` on the popover root (inherited by the wrapper) */
export const radius3Var = createVar()

export const popover = style({})

// Descendant rule, like the original `[data-ui='Popover__wrapper'] {…}` block: (0,2,0)
globalStyle(`${popover} [data-ui='Popover__wrapper']`, {
  width: '320px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: radius3Var,
  position: 'relative',
  // `overflow: hidden` fallback followed by `overflow: clip`
  overflow: ['hidden', 'clip'],
})

export const dialog = style({})

// We are using `flex-start` to make sure that the dialogs doesn't jump around when
// the content changes. This is because the dialog is centered by default, and
// when the content changes, the dialog will jump to the center of the screen.
globalStyle(`${dialog} [data-ui='DialogCard']`, {
  justifyContent: 'flex-start',
})

export const popoverHeaderCard = style({
  minHeight: 'max-content',
})

export const dialogHeaderCard = style({
  minHeight: 'max-content',
})

/** `${$itemHeight}px`, set by `PopoverListFlex` */
export const itemHeightVar = createVar()
/** `$maxDisplayedItems`, set by `PopoverListFlex` */
export const maxItemsVar = createVar()

export const popoverListFlex = style({
  vars: {
    '--list-padding': '0.5rem',
  },
  position: 'relative',
  // Calculate the max height of the list.
  // We want the max height to be the height of the list items multiplied by the max number of items.
  maxHeight: `calc(${itemHeightVar} * ${maxItemsVar} + var(--list-padding))`,
  selectors: {
    // `&&` beats Flex's own `min-height` (ui5 Flex defaults `minHeight` to 0)
    '&&': {
      minHeight: `calc((${itemHeightVar} * 1))`,
    },
  },
})
