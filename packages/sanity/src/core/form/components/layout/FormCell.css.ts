import {styleVariants} from '@vanilla-extract/css'

export const formCellArea = styleVariants({
  gutterStart: {gridArea: 'gutterStart'},
  body: {gridArea: 'body'},
  gutterEnd: {gridArea: 'gutterEnd'},
})
