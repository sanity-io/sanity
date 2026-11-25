import {type Path} from '@sanity/types'
import {AnimatePresence} from 'motion/react'

import {DivergenceIndicator} from '../../divergence/components/DivergenceIndicator'
import {type DivergenceNavigator, selectDivergence} from '../../divergence/divergenceNavigator'
import {useVersionRelease} from '../../hooks/useVersionRelease'

interface FormDivergenceIndicatorEnabledProps {
  divergenceNavigator: DivergenceNavigator & {enabled: true}
  path: Path
}

export default function FormDivergenceIndicatorEnabled({
  divergenceNavigator,
  path,
}: FormDivergenceIndicatorEnabledProps) {
  const divergence = selectDivergence(divergenceNavigator.state, path)
  const {release: upstreamBundle} = useVersionRelease(divergenceNavigator.state.upstreamId ?? '')

  return (
    <AnimatePresence>
      {divergence && divergence.divergences[0][1].status === 'unresolved' && (
        <DivergenceIndicator
          divergenceNavigator={divergenceNavigator}
          divergence={divergence}
          upstreamBundle={upstreamBundle}
        />
      )}
    </AnimatePresence>
  )
}
