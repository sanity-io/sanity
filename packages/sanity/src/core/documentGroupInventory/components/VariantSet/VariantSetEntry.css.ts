import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `${space[3]}px` */
export const space3Var = createVar()

export const variantSetEntry = style({
  position: 'relative',
  padding: space3Var,
  wordBreak: 'break-all',
  justifyContent: 'space-between',
  display: 'flex',
  gap: space3Var,
  alignItems: 'center',
  selectors: {
    '* + &': {
      borderBlockStart: '1px solid var(--card-border-color)',
    },
    '&:hover, &:focus-within': {
      backgroundColor: 'var(--card-muted-bg-color)',
    },
    '&:has(:checked)': {
      backgroundColor: 'var(--card-focus-ring-color)',
    },
  },
})

// `.atom`, `.inert` and `.primary-action` are string classes set by DocumentGroupEntry
globalStyle(`${variantSetEntry} .atom`, {
  display: 'flex',
  gap: space3Var,
  alignItems: 'center',
})

globalStyle(`${variantSetEntry} .inert`, {
  pointerEvents: 'none',
})

globalStyle(`${variantSetEntry} .primary-action`, {
  appearance: 'none',
  position: 'absolute',
  margin: 0,
  padding: 0,
  border: 0,
  background: 'none',
  inset: 0,
  opacity: 0,
})
