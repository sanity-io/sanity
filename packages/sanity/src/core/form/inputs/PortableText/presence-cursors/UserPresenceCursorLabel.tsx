import {getTheme_v2} from '@sanity/ui/theme'
import {AnimatePresence, motion, type Transition, type Variants} from 'motion/react'
import {css, styled} from 'styled-components'
import {Text, Box} from 'ui5'

import {DOT_SIZE} from './constants'

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

/** The name label shown while a presence cursor is hovered */
export default function UserPresenceCursorLabel(props: {displayName?: string; visible: boolean}) {
  const {displayName, visible} = props

  return (
    <AnimatePresence>
      {visible && (
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
            forwardedAs="div"
            trim={true}
          >
            {displayName}
          </UserText>
        </UserBox>
      )}
    </AnimatePresence>
  )
}
