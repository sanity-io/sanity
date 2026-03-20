import {globalStyle, style} from '@vanilla-extract/css'

export const paneContainer = style({
  selectors: {
    '&&': {
      height: '100%',
    },
  },
})

export const tableContainer = style({
  overflow: 'auto',
  position: 'relative',
})

export const table = style({
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontFamily: 'arial, sans-serif',
  whiteSpace: 'nowrap',
  width: '100%',
  border: '1px solid lightgray',
})

globalStyle(`${table} thead`, {
  display: 'grid',
  position: 'sticky',
  top: 0,
  zIndex: 10,
})

globalStyle(`${table} tr`, {
  padding: '0',
})

globalStyle(`${table} tr:last-child`, {
  borderBottom: 'none',
})
