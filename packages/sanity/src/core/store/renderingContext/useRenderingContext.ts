import {useSyncObservable} from 'react-rx'

import {useRenderingContextStore} from '../datastores'

export function useRenderingContext() {
  const renderingContextStore = useRenderingContextStore()

  // Kept synchronous: the rendering context emits once at boot; deferring
  // only delays consumers reacting to it.
  return useSyncObservable(renderingContextStore.renderingContext)
}
