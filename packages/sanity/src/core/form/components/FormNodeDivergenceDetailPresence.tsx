import {AnimatePresence, motion} from 'motion/react'
import {type RefObject} from 'react'

import {DivergenceDetail} from '../../divergence/components/DivergenceDetail'
import {
  type DivergenceNavigator,
  type ReachableDivergence,
} from '../../divergence/divergenceNavigator'

interface FormNodeDivergenceDetailPresenceProps {
  containerElement: RefObject<HTMLDivElement | null>
  divergence: ReachableDivergence | undefined
  divergenceNavigator: DivergenceNavigator & {enabled: true}
  readOnly: boolean | undefined
}

/** Fades the divergence detail in while its divergence is focused, and out again */
export default function FormNodeDivergenceDetailPresence(
  props: FormNodeDivergenceDetailPresenceProps,
) {
  const {containerElement, divergence, divergenceNavigator, readOnly} = props

  return (
    <AnimatePresence>
      {divergence &&
        divergence.status === 'unresolved' &&
        divergenceNavigator.state.focusedDivergence === divergence.path && (
          <motion.div
            initial={{opacity: 0}}
            exit={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.1}}
          >
            <DivergenceDetail
              containerElement={containerElement}
              divergence={divergence}
              divergenceNavigator={divergenceNavigator}
              readOnly={readOnly}
            />
          </motion.div>
        )}
    </AnimatePresence>
  )
}
