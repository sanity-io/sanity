import {type Path} from '@sanity/types'
import {useClickOutsideEvent, LayerProvider, Portal} from '@sanity/ui'
import {AnimatePresence, motion} from 'motion/react'
import {type ComponentType, type PropsWithChildren, Fragment, useEffect, useRef} from 'react'

import {DivergenceDetail} from '../../divergence/components/DivergenceDetail'
import {selectDivergence} from '../../divergence/divergenceNavigator'
import {useWorkspace} from '../../studio/workspace'
import {useDocumentDivergences} from '../contexts/DivergencesProvider'

const canUseAnchorPositioning =
  'CSS' in globalThis && typeof CSS.supports === 'function'
    ? CSS.supports('(position-anchor: --anchor)')
    : false

/**
 * @internal
 */
export interface FormNodeDivergenceDetailProps {
  path: Path
  readOnly: boolean | undefined
}

/**
 * @internal
 */
export const FormNodeDivergenceDetail: ComponentType<
  PropsWithChildren<FormNodeDivergenceDetailProps>
> = ({children, path, readOnly}) => {
  const {
    advancedVersionControl: {enabled: advancedVersionControlEnabled},
  } = useWorkspace()

  const containerElement = useRef<HTMLDivElement | null>(null)
  const divergenceDetailContainerElement = useRef<HTMLDivElement | null>(null)

  const divergenceNavigator = useDocumentDivergences()
  const divergence = selectDivergence(divergenceNavigator.state, path)

  useEffect(() => {
    if (
      typeof divergenceNavigator.state.focusedDivergence !== 'undefined' &&
      divergenceNavigator.state.focusedDivergence === divergence?.path
    ) {
      containerElement.current?.parentElement?.scrollIntoView({block: 'center'})
    }
  }, [divergenceNavigator.state.focusedDivergence, divergence?.path])

  useClickOutsideEvent(
    () => {
      if (
        typeof divergenceNavigator.state.focusedDivergence !== 'undefined' &&
        divergenceNavigator.state.focusedDivergence === divergence?.path
      ) {
        divergenceNavigator?.blurDivergence(divergence.path)
      }
    },
    () => [containerElement.current, divergenceDetailContainerElement.current],
  )

  // Only use a portal if the browser supports anchor positioning. If the browser does not support
  // anchor positioning, the element is rendered alongside the subject in the document.
  const MaybePortal = canUseAnchorPositioning ? Portal : Fragment

  if (!advancedVersionControlEnabled) {
    return children
  }

  return (
    <div ref={containerElement}>
      {children}
      <MaybePortal>
        <LayerProvider zOffset={1}>
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
                    containerElement={divergenceDetailContainerElement}
                    divergence={divergence}
                    divergenceNavigator={divergenceNavigator}
                    readOnly={readOnly}
                  />
                </motion.div>
              )}
          </AnimatePresence>
        </LayerProvider>
      </MaybePortal>
    </div>
  )
}
