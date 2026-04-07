import {type Path} from '@sanity/types'
import {AnimatePresence} from 'motion/react'
import {type PropsWithChildren, type ComponentType} from 'react'

import {DivergenceCollectionIndicator} from '../../divergence/components/DivergenceCollectionIndicator'
import {
  type DivergenceNavigator,
  selectDivergenceCount,
  selectFirstDescendantDivergence,
} from '../../divergence/divergenceNavigator'
import {useVersionRelease} from '../../divergence/hooks/useVersionRelease'
import {useDocumentDivergences} from '../contexts/DivergencesProvider'

interface Props {
  path: Path
}

export const FormNodeDivergenceCollectionIndicator: ComponentType<Props> = (props) => {
  const divergenceNavigator = useDocumentDivergences()

  if (!divergenceNavigator.enabled) {
    return null
  }

  return (
    <FormNodeDivergenceCollectionIndicatorEnabled
      {...props}
      divergenceNavigator={divergenceNavigator}
    />
  )
}

const FormNodeDivergenceCollectionIndicatorEnabled: ComponentType<
  PropsWithChildren<Props & {divergenceNavigator: DivergenceNavigator & {enabled: true}}>
> = ({divergenceNavigator, path}) => {
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
