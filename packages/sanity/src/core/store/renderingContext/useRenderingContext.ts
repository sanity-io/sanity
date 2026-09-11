import {useSyncObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {useRenderingContextStore} from '../datastores'
import {type StudioRenderingContext} from './types'

/**
 * The rendering context is resolved synchronously from the URL captured at boot and replayed to
 * every subscriber, so the render that mounts a consumer can read it directly. react-rx only
 * subscribes on commit and renders the initial value until then, while consumers act on the
 * context in the effects of that very commit (`useFeedbackAvailable` skips its probe inside the
 * dashboard), so the initial value has to be the resolved context rather than `undefined`.
 */
function readRenderingContext(
  renderingContext$: Observable<StudioRenderingContext>,
): StudioRenderingContext | undefined {
  let renderingContext: StudioRenderingContext | undefined
  renderingContext$
    .subscribe((value) => {
      renderingContext = value
    })
    .unsubscribe()
  return renderingContext
}

export function useRenderingContext(): StudioRenderingContext | undefined {
  const {renderingContext} = useRenderingContextStore()

  // Kept synchronous: the rendering context emits once at boot; deferring
  // only delays consumers reacting to it.
  return useSyncObservable(renderingContext, () => readRenderingContext(renderingContext))
}
