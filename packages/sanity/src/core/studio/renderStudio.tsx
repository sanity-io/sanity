import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {RenderStudioOptionsContext} from 'sanity/_singletons'

import {type Config} from '../config/types'
import {Studio} from './Studio'

/** @internal */
export interface RenderStudioOptions {
  basePath?: string
  reactStrictMode?: boolean
}

/**
 * @internal
 * @deprecated Use `renderStudio(rootElement, config, {reactStrictMode: true})` instead
 */
export function renderStudio(
  rootElement: HTMLElement | null,
  config: Config,
  options: boolean,
): () => void

/** @internal */
export function renderStudio(rootElement: HTMLElement | null, config: Config): () => void

/** @internal */
export function renderStudio(
  rootElement: HTMLElement | null,
  config: Config,
  options: RenderStudioOptions,
): () => void

/** @internal */
export function renderStudio(
  rootElement: HTMLElement | null,
  config: Config,
  options: RenderStudioOptions | boolean = {},
): () => void {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  const opts = typeof options === 'boolean' ? {reactStrictMode: options} : options
  const {reactStrictMode = true, basePath} = opts
  const renderOptions: RenderStudioOptions = {...opts, reactStrictMode}

  const root = createRoot(rootElement)

  const studio = (
    <RenderStudioOptionsContext.Provider value={renderOptions}>
      <Studio config={config} basePath={basePath} unstable_globalStyles />
    </RenderStudioOptionsContext.Provider>
  )

  root.render(reactStrictMode ? <StrictMode>{studio}</StrictMode> : studio)

  return () => root.unmount()
}
