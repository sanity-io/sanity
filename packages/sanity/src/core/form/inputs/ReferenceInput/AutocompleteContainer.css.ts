import {css} from '#styled-system/css'

export const root = {
  narrow: css({
    gridTemplateColumns: 'minmax(0px, 1fr)',
  }),
  wide: css({
    gridTemplateColumns: '1fr min-content',
  }),
}
