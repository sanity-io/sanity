'use client'

import ReactDOM from 'react-dom'

export function PreloadResources() {
  ReactDOM.preconnect('https://studio-static.sanity.io', {
    crossOrigin: 'anonymous',
  })
  ReactDOM.prefetchDNS('https://studio-static.sanity.io')

  return null
}
