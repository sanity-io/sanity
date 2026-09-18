import {globalStyle, style} from '@vanilla-extract/css'

export const card = style({
  position: 'relative',
  selectors: {
    // `&&`: Card (Box) sets `min-height: 0` itself
    '&&': {
      /* this is a hack to avoid layout jumps while previews are loading
             there's probably better ways of solving this */
      minHeight: '33px',
    },
  },
})

/* TextWithTone uses its own logic to set color, and we therefore need */
/* to override this logic in order to set the correct color in different states */
globalStyle(
  `${card}[data-selected] [data-ui='TextWithTone'], ${card}[data-pressed] [data-ui='TextWithTone'], ${card}:active [data-ui='TextWithTone']`,
  {
    color: 'inherit',
  },
)
