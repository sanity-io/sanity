import {useEffect, useState} from 'react'

import {
  DemoControlsMenu,
  DemoDebugPanel,
  DemoVariantSwitcher,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  queryErrorMessage,
  SiteHeader,
} from './components'
import {client} from './loader'
import {LANDING_PAGE_ID, LANDING_PAGE_QUERY, type LandingPageQueryResult} from './queries'
import {Sections} from './Sections'

interface Loaded {
  variant: string
  result: LandingPageQueryResult
}

interface Failed {
  variant: string
  error: unknown
}

export function HomePage() {
  const [variant, setVariant] = useState('')
  const [loaded, setLoaded] = useState<Loaded | undefined>(undefined)
  const [failed, setFailed] = useState<Failed | undefined>(undefined)
  const [showSwitcher, setShowSwitcher] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<LandingPageQueryResult>(
        LANDING_PAGE_QUERY,
        {id: LANDING_PAGE_ID},
        {
          ...(variant ? {variant} : {}),
          stega: false,
        },
      )
      .then((result) => {
        if (cancelled) return
        setLoaded({variant, result})
      })
      .catch((error) => {
        if (cancelled) return
        setFailed({variant, error})
      })
    return () => {
      cancelled = true
    }
  }, [variant])

  const requestOptions = variant ? {variant} : {}
  const data = loaded?.variant === variant ? loaded.result : undefined
  const error = failed?.variant === variant ? failed.error : undefined
  const loading = !data && !error

  const page = data?.page
  const latestProducts = data?.latestProducts ?? []

  return (
    <div className="app-shell">
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
        </div>
        {showDebug && <DemoDebugPanel requestOptions={requestOptions} response={data} />}
      </div>
      <main>
        {loading && <LoadingBlock />}
        {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
        {!loading && !error && !page && (
          <EmptyBlock message="No landing page yet — open the Seed coffee shop tool in the studio workspace." />
        )}
        {!loading && !error && page ? (
          <Sections page={page} latestProducts={latestProducts} activeVariant={variant} />
        ) : null}
      </main>
    </div>
  )
}
