import {css} from '#styled-system/css'

export const previewCard = css({
  /* TextWithTone uses its own logic to set color, and we therefore need */
  /* to override this logic in order to set the correct color in different states */
  "&[data-selected] [data-ui='TextWithTone'], &[data-pressed] [data-ui='TextWithTone'], &:active [data-ui='TextWithTone']":
    {
      color: 'inherit',
    },
})

export const referenceInputPreviewCard = css({
  // Card (Box) sets `min-height: 0` on itself
  '&&': {
    /* this is a hack to avoid layout jumps while previews are loading
         there's probably better ways of solving this */
    minHeight: '36px',
  },
})
