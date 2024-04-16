import {type ColorTints} from '@sanity/color'
import {type User} from '@sanity/types'
import {
  Box,
  Flex,
  // eslint-disable-next-line no-restricted-imports
  Popover,
  Text,
} from '@sanity/ui'
import {
  // eslint-disable-next-line camelcase
  getTheme_v2,
  type Theme,
} from '@sanity/ui/theme'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {useCallback, useState} from 'react'
import {css, styled} from 'styled-components'

import {useUserColor} from '../../../../user-color/hooks'

const DEBUG_HOVER_TARGET = false

const DOT_SIZE = 6

const LIGHT_SCHEME_TINT = 500
const DARK_SCHEME_TINT = 400

const CONTENT_BOX_VARIANTS: Variants = {
  animate: {opacity: 1, scaleX: 1, scaleY: 1},
  exit: {opacity: 0, scaleX: 0, scaleY: 0.5},
  initial: {opacity: 0, scaleX: 0, scaleY: 0.5},
}

const CONTENT_BOX_TRANSITION: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
  type: 'spring',
  bounce: 0,
}

const CONTENT_TEXT_VARIANTS: Variants = {
  animate: {opacity: 1},
  exit: {opacity: 0},
  initial: {opacity: 0},
}

const CONTENT_TEXT_TRANSITION: Transition = {
  duration: 0.2,
  delay: 0.15,
}

const getTint = (isDark: boolean) => (isDark ? DARK_SCHEME_TINT : LIGHT_SCHEME_TINT)
const getIsDarkScheme = (theme: Theme) => getTheme_v2(theme)?.color._dark

interface StyledProps {
  theme: Theme
  $tints: ColorTints
}

// The dot needs to be positioned using a Popover to ensure it doesn't interfere
// with the editor's text. Utilizing a Popover allows rendering it atop the cursor
// in a portal. This is essential as it won't be rendered inside the editor,
// thus preventing any interference with the text nodes.
const DotPopover = styled(Popover)<StyledProps>(({theme, $tints}) => {
  const isDark = getIsDarkScheme(theme)
  const bg = $tints[getTint(isDark)].hex

  return css`
    background-color: ${bg};
    position: relative;
    z-index: 0;

    // We only want to show the popover (i.e. the dot) on the top of
    // the cursor. Therefore, we hide the popover when it's not placed on top
    // due to auto-placement.
    &:not([data-placement='top']) {
      display: none;
    }
  `
})

const PopoverContentFlex = styled(Flex)<StyledProps>(({theme, $tints}) => {
  const isDark = getIsDarkScheme(theme)
  const bg = $tints[getTint(isDark)].hex
  const fg = $tints[isDark ? 950 : 50].hex

  return css`
    position: absolute;

    // Increase the hover target area to make it easier
    // to make it easier to display the user's name.
    width: calc(${DOT_SIZE}px * 2.5);
    height: calc(${DOT_SIZE}px * 4);

    top: -${DOT_SIZE * 1.5}px;
    left: 50%;
    transform: translateX(-50%);

    --presence-cursor-fg: ${fg};
    --presence-cursor-bg: ${bg};

    &[data-debug-hover-target='true'] {
      outline: 1px solid magenta;
    }
  `
})

const CursorLine = styled.span<StyledProps>(({theme, $tints}) => {
  const isDark = getIsDarkScheme(theme)
  const bg = $tints[getTint(isDark)].hex

  return css`
    border-left: 1px solid transparent;
    margin-left: -1px;
    pointer-events: none;
    position: relative;
    word-break: normal;
    border-color: ${bg};
    box-sizing: border-box;
  `
})

const CursorDot = styled.div`
  background-color: var(--presence-cursor-bg);
  border-radius: 50%;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
`

const UserBox = styled(motion(Box))(({theme}) => {
  const radius = getTheme_v2(theme)?.radius[4]

  return css`
    position: absolute;
    top: ${DOT_SIZE * 0.5}px;
    left: ${DOT_SIZE * 0.5}px;
    transform-origin: left;
    white-space: nowrap;
    padding: 0.2em 0.25em;
    box-sizing: border-box;
    border-radius: ${radius}px;
    background-color: var(--presence-cursor-bg);
  `
})

const UserText = styled(motion(Text))`
  color: var(--presence-cursor-fg);
`

interface UserPresenceCursorProps {
  boundaryElement: HTMLElement | null
  user: User
}

export function UserPresenceCursor(props: UserPresenceCursorProps): JSX.Element {
  const {boundaryElement, user} = props
  const {tints} = useUserColor(user.id)
  const [hovered, setHovered] = useState<boolean>(false)

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  const popoverContent = (
    <PopoverContentFlex
      $tints={tints}
      align="center"
      contentEditable={false}
      data-debug-hover-target={DEBUG_HOVER_TARGET}
      justify="center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CursorDot contentEditable={false} />

      <AnimatePresence>
        {hovered && (
          <UserBox
            animate="animate"
            exit="exit"
            flex={1}
            initial="initial"
            transition={CONTENT_BOX_TRANSITION}
            variants={CONTENT_BOX_VARIANTS}
          >
            <UserText
              animate="animate"
              exit="exit"
              initial="initial"
              size={0}
              transition={CONTENT_TEXT_TRANSITION}
              variants={CONTENT_TEXT_VARIANTS}
              weight="medium"
            >
              {user.displayName}
            </UserText>
          </UserBox>
        )}
      </AnimatePresence>
    </PopoverContentFlex>
  )

  return (
    <DotPopover
      $tints={tints}
      content={popoverContent}
      contentEditable={false}
      floatingBoundary={boundaryElement}
      open
      placement="top"
      portal
      referenceBoundary={boundaryElement}
      shadow={0}
    >
      <CursorLine $tints={tints} contentEditable={false} />
    </DotPopover>
  )
}
