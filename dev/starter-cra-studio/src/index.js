/* eslint-disable react/jsx-filename-extension */

import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
// eslint-disable-next-line import/no-unassigned-import
import './index.css'
import {CraStudio} from './Studio'

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <CraStudio />
  </StrictMode>,
)
