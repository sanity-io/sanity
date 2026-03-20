import {style} from '@vanilla-extract/css'

export const versionModeHeaderLayout = style({
  display: 'grid',
  gridArea: 'header',
  gridTemplateColumns: '1fr min-content 1fr',
  borderBlockEnd: '1px solid var(--card-border-color)',
})

export const versionModeHeaderLayoutSection = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})
