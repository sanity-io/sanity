import {useEffect, useState} from 'react'

import {
  DemoControlsMenu,
  DemoDebugPanel,
  DemoLanguageSwitcher,
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
  key: string
  result: LandingPageQueryResult
}

interface Failed {
  key: string
  error: unknown
}

export function HomePage() {
  const [variant, setVariant] = useState('')
  const [lang, setLang] = useState('en')
  const [loaded, setLoaded] = useState<Loaded | undefined>(undefined)
  const [failed, setFailed] = useState<Failed | undefined>(undefined)
  const [showSwitcher, setShowSwitcher] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    let cancelled = false
    const key = `${variant}::${lang}`
    client
      .fetch<LandingPageQueryResult>(
        LANDING_PAGE_QUERY,
        {id: LANDING_PAGE_ID, lang},
        {
          ...(variant ? {variant} : {}),
          stega: false,
        },
      )
      .then((result) => {
        if (cancelled) return
        setLoaded({key, result})
      })
      .catch((error) => {
        if (cancelled) return
        setFailed({key, error})
      })
    return () => {
      cancelled = true
    }
  }, [variant, lang])

  const requestKey = `${variant}::${lang}`
  const requestOptions = {...(variant ? {variant} : {}), lang}
  const data = loaded?.key === requestKey ? loaded.result : undefined
  const error = failed?.key === requestKey ? failed.error : undefined
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
          {showSwitcher && <DemoLanguageSwitcher value={lang} onChange={setLang} />}
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
