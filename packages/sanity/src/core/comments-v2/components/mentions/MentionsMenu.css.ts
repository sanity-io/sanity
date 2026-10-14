import {style} from '@vanilla-extract/css'

export const root = style({
  maxWidth: '220px', // todo: improve
})

const ITEM_HEIGHT = 41
const LIST_PADDING = 4
const MAX_ITEMS = 7

export const flexWrap = style({
  maxHeight: ITEM_HEIGHT * MAX_ITEMS + LIST_PADDING * 2 + ITEM_HEIGHT / 2,
})
