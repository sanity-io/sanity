import {globalStyle, style} from '@vanilla-extract/css'

export const previewCard = style({})

/* TextWithTone uses its own logic to set color, and we therefore need */
/* to override this logic in order to set the correct color in different states */
globalStyle(
  [
    `${previewCard}[data-selected] [data-ui='TextWithTone']`,
    `${previewCard}[data-pressed] [data-ui='TextWithTone']`,
    `${previewCard}:active [data-ui='TextWithTone']`,
  ].join(', '),
  {
    color: 'inherit',
  },
)

export const referenceInputPreviewCard = style({
  selectors: {
    // Card (Box) sets `min-height: 0` on itself
    '&&': {
      /* this is a hack to avoid layout jumps while previews are loading
         there's probably better ways of solving this */
      minHeight: '36px',
    },
  },
})
