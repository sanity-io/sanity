import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.input.default.hovered.border` */
export const inputHoveredBorderColorVar = createVar()
/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = createVar()

export const emptyReferenceRoot = style({
  selectors: {
    // Card's `border` prop sets `border` with `&&` (0,2,0); the styled() wrapper's (0,2,0)
    // pseudo-class rules only won by injection order, so match them with a second class.
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
    // Text sets `color` on itself
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

/* Hides the preview status dot, the button will take it's position. */
globalStyle(
  `${targetRoot}:focus-within [data-testid='compact-preview__status'], ${targetRoot}:hover [data-testid='compact-preview__status']`,
  {
    opacity: 0,
  },
)

// Rendered as `<Card as={CardLink} data-as="button">`, so Card's `&[data-as='button']` rules
// (0,2,0) share this element: `width: stretch` and `cursor: default` beat the single-class
// `width`/`cursor` below, exactly as they did before the migration. The focus box-shadow tied
// with Card's `box-shadow: var(--card-focus-ring-box-shadow)` and won by order, hence `&&`.
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
