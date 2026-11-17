import {css} from '#styled-system/css'

export const versionModeHeaderLayout = css({
  display: 'grid',
  gridArea: 'header',
  gridTemplateColumns: '1fr min-content 1fr',
  borderBlockEnd: '1px solid var(--card-border-color)',
})

export const versionModeHeaderLayoutSection = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  overflow: 'hidden',
})
