import {fromString} from '@sanity/util/paths'
import {AnimatePresence} from 'motion/react'
import {type ComponentType} from 'react'

import {DivergenceCollectionIndicator} from '../../divergence/components/DivergenceCollectionIndicator'
import {
  selectDivergenceCount,
  selectFirstDescendantDivergence,
} from '../../divergence/divergenceNavigator'
import {useVersionRelease} from '../../divergence/hooks/useVersionRelease'
import {useDocumentDivergences} from '../contexts/DivergencesProvider'

interface Props {
  path: string
}

export const FormNodeDivergenceCollectionIndicator: ComponentType<Props> = ({path}) => {
  const divergenceNavigator = useDocumentDivergences()
  const divergenceCount = selectDivergenceCount(divergenceNavigator.state, fromString(path))

  const firstDescendantDivergence = selectFirstDescendantDivergence(
    divergenceNavigator.state,
    fromString(path),
  )

  const {release: upstreamBundle} = useVersionRelease(divergenceNavigator.state.upstreamId ?? '')

  return (
    <AnimatePresence>
      {typeof divergenceCount !== 'undefined' &&
        typeof divergenceNavigator.state.upstreamId !== 'undefined' && (
          <DivergenceCollectionIndicator
            divergenceCount={divergenceCount}
            upstreamId={divergenceNavigator.state.upstreamId}
            upstreamBundle={upstreamBundle}
            onClick={() => {
              if (typeof firstDescendantDivergence !== 'undefined') {
                divergenceNavigator.focusDivergence(firstDescendantDivergence.path)
              }
            }}
          />
        )}
    </AnimatePresence>
  )
}
