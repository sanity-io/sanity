import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const styledPopover = style({})

globalStyle(`.${styledPopover} [data-ui='Popover__wrapper']`, {
  width: '320px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'clip',
})

// We are using `flex-start` to make sure that the dialogs doesn't jump around when
// the content changes. This is because the dialog is centered by default, and
// when the content changes, the dialog will jump to the center of the screen.
export const styledDialog = style({})

globalStyle(`.${styledDialog} [data-ui='DialogCard']`, {
  justifyContent: 'flex-start',
})

export const rootFlex = style({})

export const popoverHeaderCard = style({
  selectors: {
    '&&': {
      minHeight: 'max-content',
    },
  },
})

export const dialogHeaderCard = style({
  selectors: {
    '&&': {
      minHeight: 'max-content',
    },
  },
})

export const itemHeightVar = createVar()
export const maxItemsVar = createVar()

export const popoverListFlex = style({
  vars: {
    '--list-padding': '0.5rem',
  },
  position: 'relative',
  maxHeight: `calc(${itemHeightVar} * ${maxItemsVar} + var(--list-padding))`,
  minHeight: `calc(${itemHeightVar} * 1)`,
})
