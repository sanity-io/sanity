import {type ColorTints} from '@sanity/color'
import {type User} from '@sanity/types'
// eslint-disable-next-line no-restricted-imports
import {Box, Text, Tooltip as UITooltip} from '@sanity/ui'
import {type Theme} from '@sanity/ui/theme'
import {type ReactNode} from 'react'
import styled, {css} from 'styled-components'

import {useUserColor} from '../../../../user-color/hooks'

const LIGHT_SCHEME_TINT = 500
const DARK_SCHEME_TINT = 400

const getTint = (isDark: boolean) => (isDark ? DARK_SCHEME_TINT : LIGHT_SCHEME_TINT)

const RootSpan = styled.span``

const RelativeSpan = styled.span`
  position: relative;
  width: 0;
`

const DotSpan = styled.span<{theme: Theme; $tints: ColorTints}>(({theme, $tints}) => {
  const isDark = theme.sanity.color.dark
  const bg = $tints[getTint(isDark)].hex

  return css`
    position: absolute;
    top: 1px;
    transform: translate(-40%, -100%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${bg};
  `
})

const CursorSpan = styled.span<{theme: Theme; $tints: ColorTints}>(({theme, $tints}) => {
  const isDark = theme.sanity.color.dark
  const bg = $tints[getTint(isDark)].hex

  return css`
    position: absolute;
    top: 1px;
    width: 1px;
    height: 1em;
    background: ${bg};
    pointer-events: none;
  `
})

const TooltipContentBox = styled(Box)<{theme: Theme; $tints: ColorTints}>(({theme, $tints}) => {
  const radius = theme.sanity.radius[2]
  const isDark = theme.sanity.color.dark
  const bg = $tints[getTint(isDark)].hex
  const fg = $tints[isDark ? 900 : 50].hex

  return css`
    background-color: ${bg};
    border-radius: ${radius}px;
    --card-fg-color: ${fg};
    padding: 5px 4px;

    [data-ui='Text'] {
      font-size: 0.75em;
    }
  `
})

interface UserPresenceCursorProps {
  children: ReactNode
  user: User
}

export function UserPresenceCursor(props: UserPresenceCursorProps) {
  const {user, children} = props
  const {tints} = useUserColor(user.id)

  const tooltipContent = (
    <TooltipContentBox $tints={tints} sizing="border">
      <Text size={1} weight="medium">
        {user.displayName}
      </Text>
    </TooltipContentBox>
  )

  return (
    <RootSpan>
      {children}

      <RelativeSpan contentEditable={false}>
        <UITooltip
          content={tooltipContent}
          padding={0}
          placement="top"
          portal
          radius={4}
          shadow={0}
        >
          <DotSpan contentEditable={false} $tints={tints} />
        </UITooltip>

        <CursorSpan contentEditable={false} $tints={tints} />
      </RelativeSpan>
    </RootSpan>
  )
}
