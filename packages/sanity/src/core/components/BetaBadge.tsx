import React, {PropsWithChildren} from 'react'
import {hues} from '@sanity/color'
import {Badge, BadgeProps} from '@sanity/ui'
import styled, {css} from 'styled-components'

const StyledBadge = styled(Badge)(({theme}) => {
  const fgTint = theme.sanity.color.dark ? 50 : 700
  const bgTint = theme.sanity.color.dark ? 700 : 100
  const bg = hues.purple[bgTint].hex
  const fg = hues.purple[fgTint].hex

  return css`
    background-color: ${bg};
    box-shadow: inset 0 0 0 1px ${bg};
    color: ${fg};
  `
})

/** @internal */
export type BetaBadgeProps = Omit<BadgeProps, 'mode' | 'tone'>

/** @internal */
export function BetaBadge(props: PropsWithChildren<BetaBadgeProps>) {
  const {fontSize = 1, children = 'Beta', ...rest} = props

  return (
    <StyledBadge {...rest} fontSize={fontSize}>
      {children}
    </StyledBadge>
  )
}
