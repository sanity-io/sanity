import {css} from '#styled-system/css'

export const root = css({
  maxWidth: '220px', // todo: improve
})

const ITEM_HEIGHT = 41
const LIST_PADDING = 4
const MAX_ITEMS = 7

export const flexWrap = css({
  maxHeight: `${ITEM_HEIGHT * MAX_ITEMS + LIST_PADDING * 2 + ITEM_HEIGHT / 2}px`,
})
