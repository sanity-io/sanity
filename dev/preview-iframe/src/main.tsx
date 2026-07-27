// oxlint-disable-next-line no-unassigned-import -- style import is effectful
import './styles.css'

import {type ClientPerspective} from '@sanity/client'
import {enableVisualEditing} from '@sanity/visual-editing'
import {Suspense, useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'

import {HomePage} from './HomePage'
import {useLiveMode} from './loader'
import {ProductPage} from './ProductPage'

function VisualEditing() {
  const [perspective, setPerspective] = useState<ClientPerspective>('published')
  const [variant, setVariant] = useState<string | undefined>(undefined)

  useEffect(
    () =>
      enableVisualEditing({
        onPerspectiveChange: setPerspective,
        onVariantChange: setVariant,
      }),
    [],
  )
  useLiveMode({})

  return (
    <div className="ve-debug" aria-hidden>
      <span>perspective: {JSON.stringify(perspective)}</span>
      <span>variant: {variant ? JSON.stringify(variant) : 'none'}</span>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
      </Routes>
      <Suspense fallback={null}>
        <VisualEditing />
      </Suspense>
    </BrowserRouter>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

createRoot(rootEl).render(<App />)
