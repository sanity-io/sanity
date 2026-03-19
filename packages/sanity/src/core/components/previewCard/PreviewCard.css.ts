import {globalStyle, style} from '@vanilla-extract/css'

/** @internal */
export const styledCard = style({})

/* TextWithTone uses its own logic to set color, and we therefore need */
/* to override this logic in order to set the correct color in different states */
globalStyle(`${styledCard}[data-selected] [data-ui='TextWithTone'], ${styledCard}[data-pressed] [data-ui='TextWithTone'], ${styledCard}:active [data-ui='TextWithTone']`, {
  color: 'inherit',
})

/**
 *  This is a workaround for a circular import issue.
 * Calling `styled(PreviewCard)` at program load time triggered a build error with the commonjs bundle because it tried
 * to access the PreviewCard variable/symbol before it was initialized.
 * The workaround is to colocate the styled component with the component itself.
 * @internal
 */
export const referenceInputPreviewCard = style({
  selectors: {
    '&&': {
      /* this is a hack to avoid layout jumps while previews are loading
         there's probably better ways of solving this */
      minHeight: '36px',
    },
  },
})
