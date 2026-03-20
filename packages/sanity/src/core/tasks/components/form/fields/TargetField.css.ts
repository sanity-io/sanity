import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const hoveredBorderColorVar = createVar()
export const placeholderColorVar = createVar()

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
      borderColor: hoveredBorderColorVar,
    },
  },
})

export const placeholder = style({
  selectors: {
    '&&': {
      color: placeholderColorVar,
      marginLeft: '3px',
    },
  },
})

export const targetRoot = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
  },
})

export const showOnHover = style({
  opacity: 0,
  position: 'absolute',
  right: '6px',
  top: '4px',
  display: 'flex',
})

globalStyle(`${targetRoot}:focus-within ${showOnHover}, ${targetRoot}:hover ${showOnHover}`, {
  transition: 'opacity 200ms',
  opacity: 1,
})

globalStyle(`${targetRoot}:focus-within, ${targetRoot}:hover`, {
  paddingRight: '36px',
})

/* Hides the preview status dot, the button will take its position. */
globalStyle(`${targetRoot}:focus-within [data-testid='compact-preview__status'], ${targetRoot}:hover [data-testid='compact-preview__status']`, {
  opacity: 0,
})

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
