import React from 'react'
import {createRoot} from 'react-dom/client'
import type {Config} from '../config'
import {Studio} from './Studio'

export function renderStudio(rootElement: HTMLElement | null, config: Config) {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  const root = createRoot(rootElement)
  root.render(<Studio config={config} />)
  return () => root.unmount()
}
