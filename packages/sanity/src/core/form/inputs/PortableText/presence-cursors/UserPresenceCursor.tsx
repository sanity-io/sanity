import {type User} from '@sanity/types'
import {Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {AnimatePresence, motion, type Transition, type Variants} from 'motion/react'
import {useCallback, useMemo, useState} from 'react'
import {Box} from 'ui5'

import {useUserColor} from '../../../../user-color/hooks'
import {
  cursorDot,
  cursorLine,
  presenceCursorBgVar,
  presenceCursorFgVar,
  radius4Var,
  userBox,
  userText,
} from './UserPresenceCursor.css'

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

const MotionBox = motion.create(Box)
const MotionText = motion.create(Text)

interface UserPresenceCursorProps {
  children?: React.ReactNode
  user: User
}

export function UserPresenceCursor(props: UserPresenceCursorProps): React.JSX.Element {
  const {children, user} = props
  const {tints} = useUserColor(user.id)
  const {color, radius} = useThemeV2()
  const [hovered, setHovered] = useState<boolean>(false)

  const isDark = color._dark
  const bg = tints[isDark ? 400 : 500].hex
  const fg = tints[isDark ? 900 : 50].hex

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  const testId = useMemo(
    () => `presence-cursor-${user.displayName?.split(' ').join('-')}`,
    [user.displayName],
  )

  return (
    <>
      <span
        className={cursorLine}
        contentEditable={false}
        data-testid={testId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={assignInlineVars({
          [presenceCursorBgVar]: bg,
          [presenceCursorFgVar]: fg,
          [radius4Var]: `${radius[4]}px`,
        })}
      >
        <AnimatePresence>
          {hovered && (
            <MotionBox
              animate="animate"
              className={userBox}
              exit="exit"
              flex={1}
              initial="initial"
              transition={CONTENT_BOX_TRANSITION}
              variants={CONTENT_BOX_VARIANTS}
            >
              <MotionText
                animate="animate"
                className={userText}
                exit="exit"
                initial="initial"
                size={0}
                transition={CONTENT_TEXT_TRANSITION}
                variants={CONTENT_TEXT_VARIANTS}
                weight="medium"
              >
                {user.displayName}
              </MotionText>
            </MotionBox>
          )}
        </AnimatePresence>

        <div className={cursorDot} />
      </span>
      {children}
    </>
  )
}
