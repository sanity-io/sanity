import {css} from '#styled-system/css'

export const presenceBoxRightVar = '--form-field-base-header-presence-box-right'
export const presenceBoxRightHoverVar = '--form-field-base-header-presence-box-right-hover'

export const root = css({
  /* Prevent buttons from taking up extra vertical space */
  'lineHeight': 1,
  'width': '100%',
  /* For floating actions menu */
  'position': 'relative',
  "& [data-ui='PresenceBox']": {
    'position': 'absolute',
    'bottom': 0,
    'right': `var(${presenceBoxRightVar})`,
    // If hover is supported, we hide the floating card by default, so only add space for it when it's visible.
    '@media (hover: hover)': {
      position: 'absolute',
      bottom: 0,
      right: `var(${presenceBoxRightHoverVar})`,
    },
  },
})

export const contentBoxPresenceOffsetVar = '--form-field-base-header-content-box-presence-offset'

export const contentBox = css({
  // Box sets min-width and max-width on itself
  '&&': {
    maxWidth: `calc(100% - var(${contentBoxPresenceOffsetVar}))`,
    minWidth: '75%',
  },
})

export const slotBoxRightVar = '--form-field-base-header-slot-box-right'

export const slotBox = css({
  position: 'absolute',
  bottom: 0,
  right: `var(${slotBoxRightVar})`,
})

export const fieldActionsFloatingCard = css({
  'alignItems': 'center',
  'bottom': 0,
  'position': 'absolute',
  'right': 0,
  'transition': 'opacity 150ms ease',
  'lineHeight': 1,
  "&[data-visible='true']": {
    opacity: 1,
    pointerEvents: 'auto',
    width: 'max-content',
  },
  // If hover is supported, we hide the floating card by default
  // and only show it when it has focus within or when the field is hovered or focused.
  '@media (hover: hover)': {
    'opacity': 0,
    'pointerEvents': 'none',
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
  "& [data-ui='FieldActionsFlex']": {
    '@media (hover: hover)': {
      opacity: 0,
    },
  },
  "&:focus-within [data-ui='FieldActionsFlex']": {
    '@media (hover: hover)': {
      opacity: 1,
      pointerEvents: 'auto',
      width: 'max-content',
    },
  },
  "&[data-actions-visible='true'] [data-ui='FieldActionsFlex']": {
    opacity: 1,
    pointerEvents: 'auto',
    width: 'max-content',
  },
})

export const fieldActionsFlex = css({
  'transition': 'opacity 150ms ease',
  // Flex sets gap on itself
  '&&': {
    gap: 'inherit',
  },
})
