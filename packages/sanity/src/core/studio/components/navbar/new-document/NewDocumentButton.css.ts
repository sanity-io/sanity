import {css, firstThatWorks} from '#styled-system/css'

/** `${theme.radius[3]}px`, set by `StyledPopover` on the popover root (inherited by the wrapper) */
export const radius3Var = '--new-document-button-radius-3'

export const popover = css({
  // Descendant rule, like the original `[data-ui='Popover__wrapper'] {…}` block: (0,2,0)
  "& [data-ui='Popover__wrapper']": {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: `var(${radius3Var})`,
    position: 'relative',
    // `overflow: hidden` fallback followed by `overflow: clip`
    overflow: firstThatWorks('clip', 'hidden'),
  },
})

export const dialog = css({
  // We are using `flex-start` to make sure that the dialogs doesn't jump around when
  // the content changes. This is because the dialog is centered by default, and
  // when the content changes, the dialog will jump to the center of the screen.
  "& [data-ui='DialogCard']": {
    justifyContent: 'flex-start',
  },
})

export const popoverHeaderCard = css({
  minHeight: 'max-content',
})

export const dialogHeaderCard = css({
  minHeight: 'max-content',
})

/** `${$itemHeight}px`, set by `PopoverListFlex` */
export const itemHeightVar = '--new-document-button-item-height'
/** `$maxDisplayedItems`, set by `PopoverListFlex` */
export const maxItemsVar = '--new-document-button-max-items'

export const popoverListFlex = css({
  '--list-padding': '0.5rem',
  'position': 'relative',
  // Calculate the max height of the list.
  // We want the max height to be the height of the list items multiplied by the max number of items.
  'maxHeight': `calc(var(${itemHeightVar}) * var(${maxItemsVar}) + var(--list-padding))`,
  // `&&` beats Flex's own `min-height` (ui5 Flex defaults `minHeight` to 0)
  '&&': {
    minHeight: `calc((var(${itemHeightVar}) * 1))`,
  },
})
