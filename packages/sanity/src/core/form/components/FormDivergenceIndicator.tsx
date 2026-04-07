import {type Path} from '@sanity/types'
import {AnimatePresence} from 'motion/react'
import {type ComponentType} from 'react'

import {DivergenceIndicator} from '../../divergence/components/DivergenceIndicator'
import {type DivergenceNavigator, selectDivergence} from '../../divergence/divergenceNavigator'
import {useVersionRelease} from '../../divergence/hooks/useVersionRelease'
import {useDocumentDivergences} from '../contexts/DivergencesProvider'

interface Props {
  path: Path
}

export const FormDivergenceIndicator: ComponentType<Props> = (props) => {
  const divergenceNavigator = useDocumentDivergences()

  if (!divergenceNavigator.enabled) {
    return null
  }

  return <FormDivergenceIndicatorEnabled {...props} divergenceNavigator={divergenceNavigator} />
}

const FormDivergenceIndicatorEnabled: ComponentType<
  Props & {divergenceNavigator: DivergenceNavigator & {enabled: true}}
> = ({divergenceNavigator, path}) => {
  const divergence = selectDivergence(divergenceNavigator.state, path)
  const {release: upstreamBundle} = useVersionRelease(divergenceNavigator.state.upstreamId ?? '')

  return (
    <AnimatePresence>
      {divergence && divergence.divergences[0][1].status === 'unresolved' && (
        <DivergenceIndicator
          path={path}
          divergenceNavigator={divergenceNavigator}
          divergence={divergence}
          upstreamBundle={upstreamBundle}
        />
      )}
    </AnimatePresence>
  )
}
