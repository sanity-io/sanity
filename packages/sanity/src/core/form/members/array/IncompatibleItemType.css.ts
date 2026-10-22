import {css} from '#styled-system/css'

/** Theme `container[1]`, set inline by `IncompatibleItemType`. */
export const container1Var = '--incompatible-item-type-container-1'

export const popoverCard = css({
  maxWidth: `var(${container1Var})`,
})
