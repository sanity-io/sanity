import React from 'react'
import {render} from 'react-dom'
import type {SanityConfig} from '../config'
import {StudioRoot} from './StudioRoot'

export function renderStudio(rootElement: HTMLElement | null, config: SanityConfig) {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  render(<StudioRoot config={config} />, rootElement)
}
