import {type ColorTints} from '@sanity/color'
import {type User} from '@sanity/types'
import {Box, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type Theme} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {useUserColor} from '../../../../user-color/hooks'

const DEBUG_HOVER_TARGET = false

const DOT_SIZE = 6

const LIGHT_SCHEME_TINT = 500
const DARK_SCHEME_TINT = 400

const getTint = (isDark: boolean) => (isDark ? DARK_SCHEME_TINT : LIGHT_SCHEME_TINT)

interface StyledProps {
  theme: Theme
  $tints: ColorTints
}

const CursorLine = styled.span<StyledProps>(({theme, $tints}) => {
  const isDark = getTheme_v2(theme).color._dark
  const bg = $tints[getTint(isDark)].hex
  const fg = $tints[isDark ? 950 : 50].hex

  return css`
    --card-fg-color: ${fg};
    --presence-cursor-bg: ${bg};

    border-left: 1px solid transparent;
    margin-left: -1px;
    position: relative;
    word-break: normal;
    border-color: var(--presence-cursor-bg);
    box-sizing: border-box;
    * {
      mix-blend-mode: normal !important;
    }
  `
})

const UserBox = styled(Box)(({theme}) => {
  const radius = getTheme_v2(theme).radius[4]

  return css`
    position: absolute;
    transform-origin: left;
    white-space: nowrap;
    padding: 3px 4px;
    box-sizing: border-box;
    border-radius: ${radius}px;
    background-color: var(--presence-cursor-bg);
    top: 2px;
    left: 2px;
  `
})

const CursorDot = styled.span`
  display: block;
  position: absolute;
  background-color: var(--presence-cursor-bg);
  border-radius: 50%;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  top: 8px;
  left: 4.5px;
`

const DotHoverTarget = styled.span`
  position: absolute;
  width: 16px;
  height: 24px;
  left: -8px;
  top: -12px;
  cursor: default;
  [data-ui='user-box'] {
    opacity: 0;
    transform: scale(0.5);
    pointer-events: none;
    transition:
      opacity 0.2s ease-in-out,
      transform 0.2s ease-in-out;
  }

  &:hover {
    [data-ui='user-box'] {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }
  }
  &[data-debug-hover-target='true'] {
    outline: 1px solid magenta;
  }
`

interface UserPresenceCursorProps {
  user: User
}

export function UserPresenceCursor(props: UserPresenceCursorProps): JSX.Element {
  const {user} = props
  const {tints} = useUserColor(user.id)

  return (
    <CursorLine $tints={tints} contentEditable={false}>
      <DotHoverTarget data-debug-hover-target={DEBUG_HOVER_TARGET}>
        <CursorDot contentEditable={false} />
        <UserBox flex={1} data-ui="user-box" contentEditable={false}>
          <Text size={0} weight="medium">
            {user.displayName}
          </Text>
        </UserBox>
      </DotHoverTarget>
    </CursorLine>
  )
}
