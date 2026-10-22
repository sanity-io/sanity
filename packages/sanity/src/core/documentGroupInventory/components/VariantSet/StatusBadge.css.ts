import {css} from '#styled-system/css'

/** `${space[2]}px` */
export const space2Var = '--status-badge-space-2'

export const statusBadge = css({
  // Badge renders its children through Text, which sets `display: block` on its inner span with
  // `& > span` (0,1,1) — the same specificity as `.statusBadge span`. The original only won that
  // tie by styled-components injection order, so the ancestor class is doubled here.
  '&& span': {
    display: 'flex',
    alignItems: 'center',
    gap: `var(${space2Var})`,
    wordBreak: 'keep-all',
    whiteSpace: 'nowrap',
  },
})
