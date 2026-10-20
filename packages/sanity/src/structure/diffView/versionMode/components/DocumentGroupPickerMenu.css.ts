import {style} from '@vanilla-extract/css'

export const documentGroupPickerMenuPopover = style({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: 'min(calc(var(--container-0) * 1.5), calc(100vw - (var(--space-3) * 2)))',
  maxBlockSize: '75vh',
})
