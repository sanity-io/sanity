import {css, firstThatWorks} from '#styled-system/css'

export const containerFlex = css({
  'maxWidth': '480px',
  'overflow': firstThatWorks('clip', 'hidden'),
  'width': '100%',

  '&&': {
    minWidth: '150px',
  },
})
