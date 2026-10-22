import {css} from '#styled-system/css'
import {type SystemStyleObject} from '#styled-system/types'

import {type areas} from './FormRow.css'

const cellRaw = css.raw({
  minWidth: 0,
})

/* Grid items default to `min-width: auto`; let the cell shrink below its content width. */
const cell = css(cellRaw)

export const formCell = {
  gutterStart: css(cellRaw, {
    gridArea: 'gutterStart',
  }),
  body: css(cellRaw, {
    gridArea: 'body',
  }),
  gutterEnd: css(cellRaw, {
    gridArea: 'gutterEnd',
  }),
}
