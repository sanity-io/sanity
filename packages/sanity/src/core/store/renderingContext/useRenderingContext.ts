import {useSyncObservable} from 'react-rx'

import {useRenderingContextStore} from '../datastores'
import {type StudioRenderingContext} from './types'

export function useRenderingContext(): StudioRenderingContext | undefined {
  const {renderingContext, getRenderingContext} = useRenderingContextStore()

  // Kept synchronous: the rendering context emits once at boot; deferring only delays consumers
  // reacting to it. react-rx subscribes on commit and renders the initial value until then, while
  // consumers act on the context in the effects of that very commit (`useFeedbackAvailable` skips
  // its probe inside the dashboard), so the initial value is the context the store has already
  // resolved rather than `undefined`.
  return useSyncObservable(renderingContext, getRenderingContext)
}
