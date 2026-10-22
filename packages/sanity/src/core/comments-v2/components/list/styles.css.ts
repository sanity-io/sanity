import {css} from '#styled-system/css'

/** `hues.gray[dark ? 900 : 50].hex` */
export const threadCardDefaultBgVar = '--comments-v-2-list-thread-card-default-bg'
/** `hues[COMMENTS_HIGHLIGHT_HUE_KEY][dark ? 900 : 50].hex` */
export const threadCardActiveBgVar = '--comments-v-2-list-thread-card-active-bg'

export const threadCard = css({
  // `&&` beats Card's own `background-color: var(--card-bg-color)`
  '&&': {
    backgroundColor: `var(${threadCardDefaultBgVar})`,
  },
  "&&[data-active='true']": {
    backgroundColor: `var(${threadCardActiveBgVar})`,
  },
})
