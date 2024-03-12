import {enableVisualEditing} from '@sanity/visual-editing'
import {Suspense, useEffect} from 'react'
import {createRoot} from 'react-dom/client'

import {useLiveMode} from './loader'
import {SimpleBlockPortableText} from './SimpleBlockPortableText'

function Main() {
  return (
    <>
      <SimpleBlockPortableText />
      <Suspense fallback={null}>
        <VisualEditing />
      </Suspense>
    </>
  )
}

function VisualEditing() {
  useEffect(() => enableVisualEditing(), [])
  useLiveMode({})

  return null
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

const root = createRoot(rootEl)
root.render(<Main />)
