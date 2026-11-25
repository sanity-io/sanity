import {type Path} from '@sanity/types'
import {type ComponentType, lazy, Suspense} from 'react'

import {useDocumentDivergences} from '../contexts/DivergencesProvider'

const FormNodeDivergenceCollectionIndicatorEnabled = lazy(
  () => import('./FormNodeDivergenceCollectionIndicatorEnabled'),
)

interface Props {
  path: Path
}

export const FormNodeDivergenceCollectionIndicator: ComponentType<Props> = (props) => {
  const divergenceNavigator = useDocumentDivergences()

  if (!divergenceNavigator.enabled) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <FormNodeDivergenceCollectionIndicatorEnabled
        {...props}
        divergenceNavigator={divergenceNavigator}
      />
    </Suspense>
  )
}
