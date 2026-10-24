import {css} from '#styled-system/css'

/**
 * Absolute positioned button to close the dialog.
 */
export const closeButton = css({
  // Kept at single-class specificity on purpose: Button's own
  // `&:not([data-disabled='true']) { box-shadow }` rule (0,2,0) always outranked this
  // declaration, so it never applied. Raising it would create an order-dependent tie.
  'boxShadow': 'none',
  // `&&` beats Button's own position, background-color, border-radius, color and
  // --card-fg-color declarations (the styled wrapper won those ties by injection order).
  '&&': {
    'position': 'absolute',
    'top': '12px',
    'right': '12px',
    'zIndex': 20,
    'background': 'transparent',
    'borderRadius': '9999px',
    'color': 'white',
    '--card-fg-color': 'white',
  },
  // The original `:hover {}` block had no `&`, so the styled template compiled it to the
  // descendant selector `.cls :hover` (any hovered descendant), not `.cls:hover`.
  '& :hover': {
    '--card-fg-color': 'white',
  },
})

export const image = css({
  objectFit: 'cover',
  width: '100%',
  // the original declared `height: 100%` followed by `height: 196px`; the latter won
  height: '196px',
})

export const dialog = css({
  "& > [data-ui='DialogCard']": {
    maxWidth: '22.5rem',
  },
})
