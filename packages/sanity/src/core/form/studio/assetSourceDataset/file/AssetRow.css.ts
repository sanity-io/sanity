import {globalStyle, style} from '@vanilla-extract/css'

export const cardIconWrapper = style({
  backgroundColor: 'transparent',
  flexShrink: 0,
})

export const customFlex = style({})

export const customCardSelected = style({
  vars: {
    '--card-muted-fg-color': 'var(--card-bg-color)',
    '--card-fg-color': 'var(--card-bg-color)',
  },
})

export const rowButton = style({
  selectors: {
    '&&': {
      boxShadow: 'none',
      minWidth: 0,
      cursor: 'pointer',
      position: 'initial',
    },
  },
})

globalStyle(`${rowButton}::before, ${rowButton}::after`, {
  content: "''",
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  zIndex: 2,
})

globalStyle(`${rowButton}::before`, {
  zIndex: 0,
  pointerEvents: 'none',
  borderRadius: 'inherit',
})

export const rowButtonSelected = style({
  vars: {
    '--card-muted-fg-color': 'var(--card-bg-color)',
    '--card-fg-color': 'var(--card-bg-color)',
  },
})

globalStyle(`${rowButtonSelected}::before`, {
  backgroundColor: 'var(--card-focus-ring-color)',
})

globalStyle(`${rowButtonSelected} ${cardIconWrapper}`, {
  vars: {
    '--card-muted-fg-color': 'var(--card-bg-color)',
  },
})

globalStyle(`${rowButtonSelected} ${customFlex}`, {
  vars: {
    '--card-muted-fg-color': 'var(--card-bg-color)',
    '--card-fg-color': 'var(--card-bg-color)',
  },
})

export const rowButtonNotSelected = style({})

globalStyle(`${rowButtonNotSelected}:hover::before`, {
  backgroundColor: 'var(--card-bg-color)',
})

globalStyle(`${rowButtonNotSelected}:focus::before`, {
  backgroundColor: 'var(--card-code-bg-color)',
})

globalStyle(`${rowButtonNotSelected}:focus-within::before`, {
  backgroundColor: 'var(--card-bg-color)',
})

export const typeText = style({
  overflowWrap: 'anywhere',
})
