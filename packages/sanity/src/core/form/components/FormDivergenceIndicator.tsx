import {type Path} from '@sanity/types'
import {type ComponentType, lazy, Suspense} from 'react'

import {useDocumentDivergences} from '../contexts/DivergencesProvider'

const FormDivergenceIndicatorEnabled = lazy(() => import('./FormDivergenceIndicatorEnabled'))

interface Props {
  path: Path
}

export const FormDivergenceIndicator: ComponentType<Props> = (props) => {
  const divergenceNavigator = useDocumentDivergences()

  if (!divergenceNavigator.enabled) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <FormDivergenceIndicatorEnabled {...props} divergenceNavigator={divergenceNavigator} />
    </Suspense>
  )
}
