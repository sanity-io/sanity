// oxlint-disable-next-line no-unassigned-import -- style import is effectful
import './styles.css'

import {enableVisualEditing} from '@sanity/visual-editing'
import {Suspense, useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'

import {
  DemoControlsMenu,
  DemoDebugPanel,
  DemoLanguageSwitcher,
  DemoVariantSwitcher,
  SiteHeader,
} from './components'
import {DemoStateProvider, useDemoState} from './demoState'
import {HomePage} from './HomePage'
import {useLiveMode} from './loader'
import {ProductPage} from './ProductPage'

// Kept running for click-to-edit overlays when opened inside Presentation, but
// its perspective/variant state isn't shown — the demo uses its own manual
// variant switcher, which is the source of truth for what's currently being viewed.
function VisualEditing() {
  useEffect(() => enableVisualEditing({}), [])
  useLiveMode({})
  return null
}

// Rendered once, shared across every route, so "Viewing as" / Language stay
// selected when navigating from the landing page into a product detail page.
function DemoHeader() {
  const {
    variant,
    setVariant,
    lang,
    setLang,
    showSwitcher,
    setShowSwitcher,
    showDebug,
    setShowDebug,
    debugInfo,
  } = useDemoState()

  return (
    <div className="site-header-group">
      <SiteHeader />
      <div className="demo-controls-bar">
        <DemoControlsMenu
          showSwitcher={showSwitcher}
          onToggleSwitcher={setShowSwitcher}
          showDebug={showDebug}
          onToggleDebug={setShowDebug}
        />
        {showSwitcher && <DemoVariantSwitcher value={variant} onChange={setVariant} />}
        {showSwitcher && <DemoLanguageSwitcher value={lang} onChange={setLang} />}
      </div>
      {showDebug && debugInfo && (
        <DemoDebugPanel
          query={debugInfo.query}
          params={debugInfo.params}
          requestOptions={debugInfo.requestOptions}
          response={debugInfo.response}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <DemoStateProvider>
        <div className="app-shell">
          <DemoHeader />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
          </Routes>
        </div>
      </DemoStateProvider>
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
