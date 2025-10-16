import {style} from '@vanilla-extract/css'

export const styledCardStyle = style({
  selectors: {
    // TextWithTone uses its own logic to set color, and we therefore need
    // to override this logic in order to set the correct color in different states
    '&[data-selected] [data-ui="TextWithTone"]': {
      color: 'inherit',
    },
    '&[data-pressed] [data-ui="TextWithTone"]': {
      color: 'inherit',
    },
    '&:active [data-ui="TextWithTone"]': {
      color: 'inherit',
    },
  },
})

export const referenceInputPreviewCardStyle = style({
  // this is a hack to avoid layout jumps while previews are loading
  // there's probably better ways of solving this
  minHeight: '36px',
})
