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

  // With the Changes and History panel open, a third column beside the Comparing with side
  '&[data-changes-panel]': {
    gridTemplateAreas: `'header header header'
    'previous-document next-document changes-panel'`,
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(320px, 0.7fr)',
  },
})
