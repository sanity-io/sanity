import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const presenceRightVar = createVar()
export const contentMaxWidthVar = createVar()
export const slotRightVar = createVar()

export const root = style({
  /* Prevent buttons from taking up extra vertical space */
  lineHeight: '1',
  width: '100%',
  /* For floating actions menu */
  position: 'relative',
})

globalStyle(`${root} [data-ui='PresenceBox']`, {
  position: 'absolute',
  bottom: 0,
  right: presenceRightVar,
})

export const contentBox = style({
  selectors: {
    '&&': {
      maxWidth: contentMaxWidthVar,
      minWidth: '75%',
    },
  },
})

export const slotBox = style({
  position: 'absolute',
  bottom: 0,
  right: slotRightVar,
})

export const fieldActionsFloatingCard = style({
  selectors: {
    '&&': {
      alignItems: 'center',
      bottom: 0,
      position: 'absolute',
      right: 0,
      transition: 'opacity 150ms ease',
      lineHeight: '1',
    },
    "&&[data-visible='true']": {
      opacity: 1,
      pointerEvents: 'auto',
      width: 'max-content',
    },
  },
  '@media': {
    '(hover: hover)': {
      opacity: 0,
      pointerEvents: 'none',
    },
  },
})

globalStyle(`${fieldActionsFloatingCard}[data-actions-visible='true'] [data-ui='FieldActionsFlex']`, {
  opacity: 1,
  pointerEvents: 'auto',
  width: 'max-content',
})

globalStyle(`${fieldActionsFloatingCard}[data-actions-visible='false']:not(:focus-within)`, {
  boxShadow: 'none',
  background: 'transparent',
})

globalStyle(`${fieldActionsFloatingCard}[data-has-comments='true']:not([data-has-actions='true'])`, {
  boxShadow: 'none',
})

globalStyle(`${fieldActionsFloatingCard}:focus-within`, {
  opacity: 1,
  pointerEvents: 'auto',
  width: 'max-content',
})

globalStyle(`${fieldActionsFloatingCard}:focus-within [data-ui='FieldActionsFlex']`, {
  opacity: 1,
  pointerEvents: 'auto',
  width: 'max-content',
})

export const fieldActionsFlex = style({
  gap: 'inherit',
  transition: 'opacity 150ms ease',
})
