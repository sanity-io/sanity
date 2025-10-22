import {type Path} from '@sanity/types'
import {AnimatePresence} from 'motion/react'
import {type ComponentType} from 'react'

import {DivergenceIndicator} from '../../divergence/components/DivergenceIndicator'
import {selectDivergence} from '../../divergence/divergenceNavigator'
import {useVersionRelease} from '../../divergence/hooks/useVersionRelease'
import {useDocumentDivergences} from '../contexts/DivergencesProvider'

interface Props {
  path: Path
}

export const FormDivergenceIndicator: ComponentType<Props> = (props) => {
  const divergenceNavigator = useDocumentDivergences()
  const divergence = selectDivergence(divergenceNavigator.state, props.path)

  const {release: upstreamBundle} = useVersionRelease(divergenceNavigator.state.upstreamId ?? '')

  return (
    <AnimatePresence>
      {divergence && divergence.divergences[0][1].status === 'unresolved' && (
        <DivergenceIndicator
          {...props}
          divergenceNavigator={divergenceNavigator}
          divergence={divergence}
          upstreamBundle={upstreamBundle}
        />
      )}
    </AnimatePresence>
  )
}
