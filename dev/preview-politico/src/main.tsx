import './styles.css'

import {enableVisualEditing} from '@sanity/visual-editing'
import {Suspense, useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'

import {ArticlePage} from './ArticlePage'
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

// Same intent-redirect gap as dev/preview-iframe/src/main.tsx — a bare Vite +
// React Router app doesn't get a built-in /intent/* route handler the way
// Next.js does, so "Open in Studio" is forwarded to Studio's own router here.
function IntentRedirect() {
  useEffect(() => {
    window.location.replace(`${studioUrl}${window.location.pathname}${window.location.search}`)
  }, [])
  return null
}

// Syncs Presentation's own variant selector into the demo's "Viewing as" state.
function VisualEditing() {
  const {setVariant} = useDemoState()
  useEffect(
    () => enableVisualEditing({onVariantChange: (variant) => setVariant(variant ?? '')}),
    [setVariant],
  )
  useLiveMode({})
  return null
}

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
            <Route path="/story/:slug" element={<ArticlePage />} />
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
