import {of, shareReplay} from 'rxjs'

import {coreUiRenderingContext} from './coreUiRenderingContext'
import {defaultRenderingContext} from './defaultRenderingContext'
import {listCapabilities} from './listCapabilities'
import {
  type CapabilityRecord,
  type RenderingContextStore,
  type StudioRenderingContext,
} from './types'

/**
 * Rendering Context Store provides information about where Studio is being rendered, and which
 * capabilities are provided by the rendering context.
 *
 * This can be used to adapt parts of the Studio UI that are provided by the rendering context,
 * such as the global user menu.
 *
 * @param urlSearch - The URL query string to resolve the rendering context from; defaults to the
 * one captured when the studio booted.
 *
 * @internal
 */
export function createRenderingContextStore(urlSearch?: string): RenderingContextStore {
  const renderingContext = of(undefined).pipe(
    coreUiRenderingContext(urlSearch),
    defaultRenderingContext(),
    shareReplay(1),
  )

  const capabilities = renderingContext.pipe(listCapabilities(), shareReplay(1))

  // The context is static for the lifetime of the page and the pipeline resolves it synchronously
  // (the source completes right away), so connect both streams once here and keep the results:
  // consumers read them during render, where nothing may subscribe.
  let resolvedRenderingContext: StudioRenderingContext | undefined
  renderingContext.subscribe((value) => {
    resolvedRenderingContext = value
  })
  let resolvedCapabilities: CapabilityRecord | undefined
  capabilities.subscribe((value) => {
    resolvedCapabilities = value
  })

  return {
    renderingContext,
    capabilities,
    getRenderingContext: () => resolvedRenderingContext,
    getCapabilities: () => resolvedCapabilities,
  }
}
