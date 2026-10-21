import {globalStyle, style} from '@vanilla-extract/css'

/**
 * Absolute positioned button to close the dialog.
 */
export const closeButton = style({
  boxShadow: 'none',
  selectors: {
    '&&': {
      position: 'absolute',
      top: '12px',
      right: '12px',
      zIndex: 20,
      background: 'transparent',
      borderRadius: '9999px',
      color: 'white',
      vars: {
        '--card-fg-color': 'white',
      },
    },
  },
})

// The original `:hover {}` block had no `&`, so the styled template compiled it to the
// descendant selector `.cls :hover` (any hovered descendant), not `.cls:hover`.
globalStyle(`${closeButton} :hover`, {
  vars: {
    '--card-fg-color': 'white',
  },
})

export const image = style({
  objectFit: 'cover',
  width: '100%',
  height: '196px',
})

export const dialog = style({})

globalStyle(`${dialog} > [data-ui='DialogCard']`, {
  maxWidth: '22.5rem',
})
