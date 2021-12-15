/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore This may not yet be built.
import {StudioRoot} from '@sanity/base/studio'
import React from 'react'
import {render} from 'react-dom'
import sanityConfig from '$config'

const rootElement = document.getElementById('sanity')

if (!rootElement) {
  throw new Error('missing root element')
}

render(<StudioRoot config={sanityConfig} />, rootElement)
