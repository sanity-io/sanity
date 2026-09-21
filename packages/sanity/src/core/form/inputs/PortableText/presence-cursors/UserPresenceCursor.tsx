import {Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {AnimatePresence, motion, type Transition, type Variants} from 'motion/react'
import {useCallback, useEffect, useId, useMemo, useReducer, useState} from 'react'
import {Box} from 'ui5'

import {usePresenceReporter} from '../../../../presence/overlay/tracker'
import {type FieldPresenceData, type FormNodePresence} from '../../../../presence/types'
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
  presence: FormNodePresence
}

/** The nearest ancestor that scrolls vertically, i.e. the editor's scroll container */
function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null
  while (node) {
    const {overflowY} = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node
    }
    node = node.parentElement
  }
  return null
}

const increment = (count: number) => count + 1

export function UserPresenceCursor(props: UserPresenceCursorProps): React.JSX.Element {
  const {children, presence} = props
  const {user} = presence
  const {tints} = useUserColor(user.id)
  const {color, radius} = useThemeV2()
  const [hovered, setHovered] = useState<boolean>(false)
  const [element, setElement] = useState<HTMLSpanElement | null>(null)
  const scrollParent = useMemo(() => getScrollParent(element), [element])

  // Register the cursor with the presence overlay, which shows an avatar pointing towards the
  // cursor when it is out of view: at the edge of the editor's scroll container while the cursor
  // is hidden by the editor's own scrolling, or in the overlay's docks when the editor itself is
  // scrolled out of view. `inline` tells the overlay to render nothing while the cursor is visible.
  const reporterId = useId()
  const reporterGetSnapshot = useCallback(
    (): FieldPresenceData => ({
      element,
      presence: [presence],
      maxAvatars: 1,
      inline: true,
      clipElement: scrollParent,
    }),
    [element, presence, scrollParent],
  )
  usePresenceReporter(element ? reporterId : null, reporterGetSnapshot)

  // The overlay only re-measures when a reporter publishes, and scrolling the editor moves the
  // cursor relative to the overlay without re-rendering anything, so publish on scroll.
  const [, publish] = useReducer(increment, 0)
  useEffect(() => {
    if (!scrollParent) return undefined
    scrollParent.addEventListener('scroll', publish, {passive: true})
    return () => scrollParent.removeEventListener('scroll', publish)
  }, [scrollParent])

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
        ref={setElement}
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
