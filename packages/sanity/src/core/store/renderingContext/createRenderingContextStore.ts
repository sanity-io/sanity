import {of, shareReplay} from 'rxjs'

import {coreUiRenderingContext} from './coreUiRenderingContext'
import {defaultRenderingContext} from './defaultRenderingContext'
import {listCapabilities} from './listCapabilities'
import {type RenderingContextStore} from './types'

/**
 * Rendering Context Store provides information about where Studio is being rendered, and which
 * capabilities are provided by the rendering context.
 *
 * This can be used to adapt parts of the Studio UI that are provided by the rendering context,
 * such as the global user menu.
 *
 * @internal
 */
export function createRenderingContextStore(): RenderingContextStore {
  const renderingContext = of(undefined).pipe(
    coreUiRenderingContext(),
    defaultRenderingContext(),
    shareReplay(1),
  )

  const capabilities = renderingContext.pipe(listCapabilities(), shareReplay(1))

  return {
    renderingContext,
    capabilities,
  }
}
