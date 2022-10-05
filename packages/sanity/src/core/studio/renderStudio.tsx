import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import type {Config} from '../config'
import {Studio} from './Studio'

/** @internal */
export function renderStudio(
  rootElement: HTMLElement | null,
  config: Config,
  reactStrictMode = false
): () => void {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  const root = createRoot(rootElement)

  root.render(
    reactStrictMode ? (
      <StrictMode>
        <Studio config={config} unstable_globalStyles />
      </StrictMode>
    ) : (
      <Studio config={config} unstable_globalStyles />
    )
  )

  return () => root.unmount()
}
