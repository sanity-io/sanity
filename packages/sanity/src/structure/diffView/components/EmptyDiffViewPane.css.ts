import {css} from '#styled-system/css'

/** The next side before anything is picked: the grid cell the next pane would fill, its text centred. */
export const emptyDiffViewPane = css({
  gridArea: 'next-document',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '2rem',
  borderLeft: '1px solid var(--card-border-color)',
  textAlign: 'center',
})
