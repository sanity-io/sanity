import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.input.default.hovered.border` */
export const inputHoveredBorderColorVar = createVar()
/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = createVar()

export const emptyReferenceRoot = style({
  selectors: {
    '&&:focus': {
      border: '1px solid var(--card-focus-ring-color)',
    },
    '&&:focus-visible': {
      outline: 'none',
      border: '1px solid var(--card-focus-ring-color)',
    },
    '&&:hover': {
      borderColor: inputHoveredBorderColorVar,
    },
  },
})

export const placeholder = style({
  marginLeft: '3px',
  selectors: {
    '&&': {
      color: inputPlaceholderColorVar,
    },
  },
})

// This allows to hide and show the remove button on hover or focus.
export const targetRoot = style({
  position: 'relative',
  selectors: {
    '&:focus-within, &:hover': {
      paddingRight: '36px',
    },
  },
})

export const showOnHover = style({
  opacity: 0,
  position: 'absolute',
  right: '6px',
  top: '4px',
  display: 'flex',
  selectors: {
    [`${targetRoot}:focus-within &, ${targetRoot}:hover &`]: {
      transition: 'opacity 200ms',
      opacity: 1,
    },
  },
})

/* Hides the preview status dot; the button will take its position. */
globalStyle(
  `${targetRoot}:focus-within [data-testid='compact-preview__status'], ${targetRoot}:hover [data-testid='compact-preview__status']`,
  {
    opacity: 0,
  },
)

export const styledIntentLink = style({
  textDecoration: 'none',
  width: '100%',
  overflow: 'hidden',
  cursor: 'pointer',
  selectors: {
    '&&:focus': {
      boxShadow: '0 0 0 1px var(--card-focus-ring-color)',
    },
    '&&:focus-visible': {
      outline: 'none',
      boxShadow: '0 0 0 1px var(--card-focus-ring-color)',
    },
  },
})
