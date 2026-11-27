import {type Path} from '@sanity/types'
import {AnimatePresence} from 'motion/react'

import {DivergenceCollectionIndicator} from '../../divergence/components/DivergenceCollectionIndicator'
import {
  type DivergenceNavigator,
  selectDivergenceCount,
  selectFirstDescendantDivergence,
} from '../../divergence/divergenceNavigator'
import {useVersionRelease} from '../../hooks/useVersionRelease'

interface FormNodeDivergenceCollectionIndicatorEnabledProps {
  divergenceNavigator: DivergenceNavigator & {enabled: true}
  path: Path
}

export default function FormNodeDivergenceCollectionIndicatorEnabled({
  divergenceNavigator,
  path,
}: FormNodeDivergenceCollectionIndicatorEnabledProps) {
  const divergenceCount = selectDivergenceCount(divergenceNavigator.state, path)

  const firstDescendantDivergence = selectFirstDescendantDivergence(divergenceNavigator.state, path)

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
