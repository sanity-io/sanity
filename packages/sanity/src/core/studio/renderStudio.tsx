import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import {type Config} from '../config'
import {ensureCdnCssLink} from './ensureCdnCssLink'
import {Studio} from './Studio'

interface RenderStudioOptions {
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
  options: RenderStudioOptions | boolean = false,
): () => void {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  const opts = typeof options === 'boolean' ? {reactStrictMode: options} : options
  const {reactStrictMode = false, basePath} = opts

  const root = createRoot(rootElement)

  const render = () => {
    root.render(
      reactStrictMode ? (
        <StrictMode>
          <Studio config={config} basePath={basePath} unstable_globalStyles />
        </StrictMode>
      ) : (
        <Studio config={config} basePath={basePath} unstable_globalStyles />
      ),
    )
  }

  // Check if the static CSS file has been loaded (set by styles.css via vanilla-extract).
  // If not, attempt to inject the CSS link from the CDN import map as a fallback for
  // studios deployed with older CLIs that don't have the CSS-aware runtime script.
  // Defer the initial render until the CSS link has loaded to prevent FOUC.
  const staticCssLoaded = getComputedStyle(rootElement)
    .getPropertyValue('--static-css-file-loaded-studio')
    .trim()

  if (!staticCssLoaded) {
    const link = ensureCdnCssLink(import.meta.url, 'sanity')
    if (link) {
      link.onload = render
      link.onerror = render // render anyway if CSS fails to load
    } else {
      render()
    }
  } else {
    render()
  }

  return () => root.unmount()
}
