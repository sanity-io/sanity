import React from 'react'
import {render} from 'react-dom'
import studioConfig from '@sanity-studio-config'
import {StudioRoot} from '../studio'

export function renderStudio(rootElement: HTMLElement | null) {
  if (!rootElement) {
    throw new Error('Missing root element to mount application into')
  }

  render(<StudioRoot config={studioConfig} />, rootElement)
}

// Intentional side-effect
renderStudio(document.getElementById('sanity'))
