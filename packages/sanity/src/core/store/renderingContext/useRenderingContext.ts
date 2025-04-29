import {useObservable} from 'react-rx'

import {useRenderingContextStore} from '../_legacy/datastores'

export function useRenderingContext() {
  const renderingContextStore = useRenderingContextStore()

  return useObservable(renderingContextStore.renderingContext)
}
