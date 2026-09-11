import {createVar, style} from '@vanilla-extract/css'

/** `hues.gray[dark ? 900 : 50].hex` */
export const threadCardDefaultBgVar = createVar()
/** `hues[COMMENTS_HIGHLIGHT_HUE_KEY][dark ? 900 : 50].hex` */
export const threadCardActiveBgVar = createVar()

export const threadCard = style({
  selectors: {
    // `&&` beats Card's own `background-color: var(--card-bg-color)`
    '&&': {
      backgroundColor: threadCardDefaultBgVar,
    },
    "&&[data-active='true']": {
      backgroundColor: threadCardActiveBgVar,
    },
  },
})
