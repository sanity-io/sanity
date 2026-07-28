// oxlint-disable-next-line no-unassigned-import -- style import is effectful
import './styles.css'

import {enableVisualEditing} from '@sanity/visual-editing'
import {Suspense, useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'

import {HomePage} from './HomePage'
import {useLiveMode} from './loader'
import {ProductPage} from './ProductPage'

// Kept running for click-to-edit overlays when opened inside Presentation, but
// its perspective/variant state isn't shown — the demo uses its own manual
// variant switcher (see DemoVariantSwitcher in HomePage), which is the source
// of truth for what's currently being viewed.
function VisualEditing() {
  useEffect(() => enableVisualEditing({}), [])
  useLiveMode({})
  return null
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
