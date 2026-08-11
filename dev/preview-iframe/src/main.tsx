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
import {studioUrl, useLiveMode} from './loader'
import {ProductPage} from './ProductPage'

// @sanity/visual-editing's "Open in Studio" affordance navigates to an
// /intent/edit/... URL on THIS app, expecting the hosting framework to
// intercept it and redirect to the actual Studio (Next.js does this via a
// built-in route handler; a bare Vite + React Router app doesn't get one for
// free). Studio's own router understands this exact path+query shape, so all
// that's needed is forwarding it there unchanged.
function IntentRedirect() {
  useEffect(() => {
    window.location.replace(`${studioUrl}${window.location.pathname}${window.location.search}`)
  }, [])
  return null
}

// Syncs Presentation's own variant selector into the demo's "Viewing as"
// state via enableVisualEditing's onVariantChange callback, so switching the
// variant in Presentation drives the same state the manual switcher does —
// one source of truth, whichever side changes it.
function VisualEditing() {
  const {setVariant} = useDemoState()
  useEffect(
    () => enableVisualEditing({onVariantChange: (variant) => setVariant(variant ?? '')}),
    [setVariant],
  )
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
            <Route path="/intent/*" element={<IntentRedirect />} />
          </Routes>
        </div>
        <Suspense fallback={null}>
          <VisualEditing />
        </Suspense>
      </DemoStateProvider>
    </BrowserRouter>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

createRoot(rootEl).render(<App />)
