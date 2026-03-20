import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const addedBgVar = createVar()
export const addedBorderVar = createVar()
export const addedHoverBgVar = createVar()
export const addedHoverBorderVar = createVar()
export const addedNestedBgVar = createVar()
export const addedNestedBorderVar = createVar()
export const authoringBgVar = createVar()
export const authoringBorderVar = createVar()
export const blendModeVar = createVar()

export const highlightSpan = style({
  boxSizing: 'border-box',
  transition: 'background-color 100ms ease, border-color 100ms ease',
  selectors: {
    '&[data-inline-comment-state="added"][data-inline-comment-nested="false"]': {
      backgroundColor: addedBgVar,
      borderBottom: `2px solid ${addedBorderVar}`,
    },
    '&[data-inline-comment-state="added"][data-inline-comment-nested="true"]': {
      backgroundColor: addedNestedBgVar,
      borderBottom: `2px solid ${addedNestedBorderVar}`,
    },
    '&[data-inline-comment-state="added"][data-inline-comment-nested="false"][data-hovered="true"]': {
      backgroundColor: addedHoverBgVar,
      borderBottom: `2px solid ${addedHoverBorderVar}`,
    },
    '&[data-inline-comment-state="authoring"]': {
      backgroundColor: authoringBgVar,
      borderBottom: `2px solid ${authoringBorderVar}`,
    },
  },
})

// Make sure that child elements appropriately blend with the
// background of the highlight span
globalStyle(`${highlightSpan} *`, {
  mixBlendMode: blendModeVar as any,
})
