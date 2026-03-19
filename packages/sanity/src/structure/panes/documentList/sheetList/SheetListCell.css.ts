import {createVar, style} from '@vanilla-extract/css'

export const cellWidthVar = createVar()

export const dataCell = style({
  display: 'flex',
  overflow: 'hidden',
  boxSizing: 'border-box',
  width: cellWidthVar,
  borderTop: '1px solid var(--card-border-color)',
  backgroundColor: 'var(--card-bg-color)',
})

export const pinnedDataCell = style([dataCell, {
  position: 'sticky',
  zIndex: 2,
}])
