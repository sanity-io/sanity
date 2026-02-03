import {useRenderingContextStore} from '../_legacy/datastores'
import {useObservable} from 'react-rx'

export function useRenderingContext() {
  const renderingContextStore = useRenderingContextStore()

  return useObservable(renderingContextStore.renderingContext)
}
