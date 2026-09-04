import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const presenceBoxRightVar = createVar()
export const presenceBoxRightHoverVar = createVar()

export const root = style({
  /* Prevent buttons from taking up extra vertical space */
  lineHeight: 1,
  width: '100%',
  /* For floating actions menu */
  position: 'relative',
})

globalStyle(`${root} [data-ui='PresenceBox']`, {
  'position': 'absolute',
  'bottom': 0,
  'right': presenceBoxRightVar,
  '@media': {
    // If hover is supported, we hide the floating card by default, so only add space for it when it's visible.
    '(hover: hover)': {
      position: 'absolute',
      bottom: 0,
      right: presenceBoxRightHoverVar,
    },
  },
})

export const contentBoxPresenceOffsetVar = createVar()

export const contentBox = style({
  selectors: {
    // Box sets min-width and max-width on itself
    '&&': {
      maxWidth: `calc(100% - ${contentBoxPresenceOffsetVar})`,
      minWidth: '75%',
    },
  },
})

export const slotBoxRightVar = createVar()

export const slotBox = style({
  position: 'absolute',
  bottom: 0,
  right: slotBoxRightVar,
})

export const fieldActionsFloatingCard = style({
  'alignItems': 'center',
  'bottom': 0,
  'position': 'absolute',
  'right': 0,
  'transition': 'opacity 150ms ease',
  'lineHeight': 1,
  'selectors': {
    "&[data-visible='true']": {
      opacity: 1,
      pointerEvents: 'auto',
      width: 'max-content',
    },
  },
  '@media': {
    // If hover is supported, we hide the floating card by default
    // and only show it when it has focus within or when the field is hovered or focused.
    '(hover: hover)': {
      opacity: 0,
      pointerEvents: 'none',
      selectors: {
        "&[data-actions-visible='false']:not(:focus-within)": {
          // Remove the shadow when the field actions are not visible
          boxShadow: 'none',
          // Since the field actions always will be present in the DOM (to make them focusable) –
          // they will always affect the width of the floating card, even when they are not visible.
          // Therefore, we remove the background of the floating card when the field actions are not visible.
          background: 'transparent',
        },
        // Remove the shadow when the field has comments but no actions
        "&[data-has-comments='true']:not([data-has-actions='true'])": {
          boxShadow: 'none',
        },
        // Show the floating card when it has focus within (ie when field actions are focused).
        '&:focus-within': {
          opacity: 1,
          pointerEvents: 'auto',
          width: 'max-content',
        },
      },
    },
  },
})

globalStyle(`${fieldActionsFloatingCard} [data-ui='FieldActionsFlex']`, {
  '@media': {
    '(hover: hover)': {
      opacity: 0,
    },
  },
})

globalStyle(`${fieldActionsFloatingCard}:focus-within [data-ui='FieldActionsFlex']`, {
  '@media': {
    '(hover: hover)': {
      opacity: 1,
      pointerEvents: 'auto',
      width: 'max-content',
    },
  },
})

globalStyle(
  `${fieldActionsFloatingCard}[data-actions-visible='true'] [data-ui='FieldActionsFlex']`,
  {
    opacity: 1,
    pointerEvents: 'auto',
    width: 'max-content',
  },
)

export const fieldActionsFlex = style({
  transition: 'opacity 150ms ease',
  selectors: {
    // Flex sets gap on itself
    '&&': {
      gap: 'inherit',
    },
  },
})
