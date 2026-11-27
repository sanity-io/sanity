import {hues} from '@sanity/color'
import {AnimatePresence, motion, type Variants} from 'motion/react'
import {css, styled} from 'styled-components'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'

const HIGHLIGHT_BLOCK_VARIANTS: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
}

const HighlightDiv = styled(motion.div)(({theme}) => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {radius, space, color} = theme.sanity
  const bg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][color.dark ? 900 : 50].hex

  return css`
    mix-blend-mode: ${color.dark ? 'screen' : 'multiply'};
    border-radius: ${radius[3]}px;
    top: -${space[2]}px;
    left: -${space[2]}px;
    bottom: -${space[2]}px;
    right: -${space[2]}px;
    pointer-events: none;
    position: absolute;
    z-index: 1;
    width: calc(100% + ${space[2] * 2}px);
    height: calc(100% + ${space[2] * 2}px);
    background-color: ${bg};
  `
})

/** The highlight over a field whose comment thread is selected */
export default function CommentsFieldHighlight({visible}: {visible: boolean}) {
  return (
    <AnimatePresence>
      {visible && (
        <HighlightDiv
          animate="animate"
          exit="exit"
          initial="initial"
          variants={HIGHLIGHT_BLOCK_VARIANTS}
        />
      )}
    </AnimatePresence>
  )
}
