import React from 'react'
import {createRoot} from 'react-dom/client'
import {StudioRoot} from '@sanity/base/studio'
import config from './sanity.config'

// eslint-disable-next-line no-console
console.log('Rendering studio in React 18 strict mode')

const root = createRoot(document.getElementById('sanity'))
root.render(
  <React.StrictMode>
    <StudioRoot config={config} />
  </React.StrictMode>
)
