import {createVar, style} from '@vanilla-extract/css'

export const threadCardActiveBgVar = createVar()
export const threadCardDefaultBgVar = createVar()

export const threadCardStyle = style({
  selectors: {
    '&&': {
      backgroundColor: threadCardDefaultBgVar,
    },
    '&&[data-active="true"]': {
      backgroundColor: threadCardActiveBgVar,
    },
  },
})
