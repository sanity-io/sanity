import React from 'react'
import {render} from 'react-dom'
import type {SanityConfig} from '../config'
import {Studio} from './Studio'

export function renderStudio(rootElement: HTMLElement | null, config: SanityConfig) {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  render(<Studio config={config} />, rootElement)
}
