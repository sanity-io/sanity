import {style} from '@vanilla-extract/css'

// The Schedule value reads as plain text (matching the other property values), but stays clickable
// to open the picker: a flush, chrome-free button that only underlines on hover — no pill, and its
// text sits on the same left edge as every other value.
export const scheduleTrigger = style({
  appearance: 'none',
  background: 'none',
  border: 0,
  margin: 0,
  padding: 0,
  display: 'block',
  width: '100%',
  minWidth: 0,
  textAlign: 'left',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      textDecoration: 'underline',
    },
  },
})
