import {css} from '#styled-system/css'

export const dialogLayout = css({
  '--offset-block': '40px',

  'display': 'grid',
  'height': 'calc(100vh - var(--offset-block))',
  'minHeight': 0,
  'overflow': 'hidden',
  'gridTemplateAreas': `'header header'
    'previous-document next-document'`,
  'gridTemplateColumns': '1fr 1fr',
  'gridTemplateRows': 'min-content minmax(0, 1fr)',
})
