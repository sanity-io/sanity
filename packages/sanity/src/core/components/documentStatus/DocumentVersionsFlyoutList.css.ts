import {css} from '#styled-system/css'

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '8px',
  width: '400px',
  maxWidth: '100vw',
  boxSizing: 'border-box',
})

export const name = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  minWidth: 0,
})

// A 15px slot, so the names of the default row and of the audience rows line up. The diamond is
// purple at rest and takes the text colour on a selected row.
export const variantMark = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  width: '15px',
})

// The subtitle sits under the name, past the 15px diamond slot and its 4px gap.
export const subtitleIndent = css({
  paddingLeft: '19px',
  minWidth: 0,
})
