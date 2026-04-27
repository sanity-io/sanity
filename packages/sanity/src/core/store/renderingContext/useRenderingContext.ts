import {useObservable} from 'react-rx'

import {useRenderingContextStore} from '../datastores'

export function useRenderingContext() {
  const renderingContextStore = useRenderingContextStore()

  return useObservable(renderingContextStore.renderingContext)
}
