import {type ColorTints} from '@sanity/color'
import {type User} from '@sanity/types'
import {Box, Text} from '@sanity/ui'
import {
  // eslint-disable-next-line camelcase
  getTheme_v2,
} from '@sanity/ui/theme'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {useCallback, useMemo, useState} from 'react'
import {css, styled} from 'styled-components'

import {useUserColor} from '../../../../user-color/hooks'

const DOT_SIZE = 6

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

const CursorLine = styled.span<{$tints: ColorTints}>(({theme, $tints}) => {
  const isDark = getTheme_v2(theme)?.color._dark
  const bg = $tints[isDark ? 400 : 500].hex
  const fg = $tints[isDark ? 900 : 50].hex

  return css`
    --presence-cursor-bg: ${bg};
    --presence-cursor-fg: ${fg};

    border-left: 1px solid transparent;
    border-color: var(--presence-cursor-bg);
    margin-left: -1px;
    position: relative;
    word-break: normal;
    white-space: normal;
    mix-blend-mode: unset;
    pointer-events: none;
  `
})

const CursorDot = styled.div`
  background-color: var(--presence-cursor-bg);
  border-radius: 50%;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  position: absolute;
  top: -${DOT_SIZE - 1}px;
  left: -0.5px;
  transform: translateX(-50%);
  mix-blend-mode: unset;
  z-index: 0;
  pointer-events: all;

  // Increase the hit area of the cursor dot
  &:before {
    content: '';
    position: absolute;
    top: -${DOT_SIZE / 2}px;
    left: 50%;
    transform: translateX(-50%);
    width: ${DOT_SIZE * 2}px;
    height: ${DOT_SIZE * 3}px;
    opacity: 0.5;
  }
`

const UserBox = styled(motion.create(Box))(({theme}) => {
  const radius = getTheme_v2(theme)?.radius[4]

  return css`
    position: absolute;
    top: -${DOT_SIZE * 1.5}px;
    left: -${DOT_SIZE * 0.75}px;
    transform-origin: left;
    white-space: nowrap;
    padding: 3px 6px;
    box-sizing: border-box;
    border-radius: ${radius}px;
    background-color: var(--presence-cursor-bg);
    z-index: 1;
    mix-blend-mode: unset;
    user-select: none;
  `
})

const UserText = styled(motion.create(Text))`
  color: var(--presence-cursor-fg);
  mix-blend-mode: unset;
`

interface UserPresenceCursorProps {
  children?: React.ReactNode
  user: User
}

export function UserPresenceCursor(props: UserPresenceCursorProps): React.JSX.Element {
  const {children, user} = props
  const {tints} = useUserColor(user.id)
  const [hovered, setHovered] = useState<boolean>(false)

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  const testId = useMemo(
    () => `presence-cursor-${user.displayName?.split(' ').join('-')}`,
    [user.displayName],
  )

  return (
    <>
      <CursorLine
        $tints={tints}
        contentEditable={false}
        data-testid={testId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
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

        <CursorDot />
      </CursorLine>
      {children}
    </>
  )
}
