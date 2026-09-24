import {style} from '@vanilla-extract/css'

export const rootFlex = style({
  width: '100%',
})

export const styleSelectBox = style({
  width: '8em',
})

export const styleSelectFlex = style({
  borderRight: '1px solid var(--card-border-color)',
})

/** `ActionMenuBox` when the insert menu is shown next to it */
export const actionMenuBoxWithInsertMenu = style({
  maxWidth: 'max-content',
  borderRight: '1px solid var(--card-border-color)',
})

export const fullscreenButtonBox = style({
  borderLeft: '1px solid var(--card-border-color)',
})
