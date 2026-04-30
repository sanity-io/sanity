import {StrictMode, Suspense} from 'react'
import {createRoot} from 'react-dom/client'

import {type Config} from '../config'
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

  let fallbackStylesheet: React.JSX.Element | undefined

  // Check if the static CSS file has been loaded (set by styles.css via vanilla-extract).
  // If not, attempt to inject the CSS link from the CDN import map as a fallback for
  // studios deployed with older CLIs that don't have the CSS-aware runtime script.
  // React 19 suspends rendering until <link precedence="..."> stylesheets load.
  if (
    !getComputedStyle(rootElement).getPropertyValue('--static-css-file-loaded-studio').trim()
  ) {
    const importmap = JSON.parse(
      document.querySelector('script[type=importmap]')?.textContent || '{}',
    )
    if (importmap.imports && 'sanity/' in importmap.imports) {
      fallbackStylesheet = (
        <link rel="stylesheet" href={`${importmap.imports['sanity/']}index.css`} precedence="sanity" />
      )
      // @TODO console.warn that this auto updating studio must be redeployed with the latest version of `sanity` to improve the performance of how CSS is loaded
    } else {
      // @TODO console.error that Studio CSS is missing and that there's something wrong with the custom deployment
    }
  }

  // No Suspense fallback, as suspending at this level means there is no stylesheet, which means
  // we may not show the right fallback UI. Any `fallback` prop here must be built to render
  // correctly even if all external css files are missing.
  const children = (
    <Suspense>
      {fallbackStylesheet}
      <Studio config={config} basePath={basePath} unstable_globalStyles />
    </Suspense>
  )

  const root = createRoot(rootElement)

  root.render(reactStrictMode ? <StrictMode>{children}</StrictMode> : children)

  return () => root.unmount()
}
