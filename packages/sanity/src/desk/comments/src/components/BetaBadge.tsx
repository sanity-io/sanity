import React from 'react'
import {hues} from '@sanity/color'
import {Badge} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const StyledBadge = styled(Badge)(({theme}) => {
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

export function BetaBadge() {
  return <StyledBadge>Beta</StyledBadge>
}
