import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {Studio} from 'sanity'
import config from './sanity.config'

// eslint-disable-next-line no-console
console.log('Rendering studio in React 18 strict mode')

const root = createRoot(document.getElementById('sanity'))
root.render(
  <StrictMode>
    <Studio config={config} />
  </StrictMode>,
)
