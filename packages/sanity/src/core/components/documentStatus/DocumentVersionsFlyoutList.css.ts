import {css} from '#styled-system/css'

/** The list row's height: 8px padding around the 33px media. The flyout rows match it. */
const ROW_HEIGHT = 49

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '8px',
  width: '400px',
  maxWidth: '100vw',
  boxSizing: 'border-box',
})

export const row = css({
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  minHeight: `${ROW_HEIGHT}px`,
  padding: '8px',
  textAlign: 'left',
  cursor: 'pointer',
})

export const rowContent = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '33px',
})

export const media = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  width: '33px',
  height: '33px',
})

export const text = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: '4px',
  minWidth: 0,
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
