import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import {type Config} from '../config'
import {Studio, type StudioProps} from './Studio'

interface RenderStudioOptions extends Pick<StudioProps, 'basePath' | 'unstable_temporaryToken'> {
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
  options: RenderStudioOptions | boolean = false,
): () => void {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  const opts = typeof options === 'boolean' ? {reactStrictMode: options} : options
  const {reactStrictMode = false, basePath, unstable_temporaryToken} = opts

  const root = createRoot(rootElement)

  root.render(
    reactStrictMode ? (
      <StrictMode>
        <Studio
          config={config}
          basePath={basePath}
          unstable_globalStyles
          unstable_temporaryToken={unstable_temporaryToken}
        />
      </StrictMode>
    ) : (
      <Studio config={config} basePath={basePath} unstable_globalStyles />
    ),
  )

  return () => root.unmount()
}
