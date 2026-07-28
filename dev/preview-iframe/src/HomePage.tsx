import {useEffect, useState} from 'react'

import {EmptyBlock, ErrorBlock, LoadingBlock, queryErrorMessage} from './components'
import {useDemoState} from './demoState'
import {client} from './loader'
import {LANDING_PAGE_ID, LANDING_PAGE_QUERY, type LandingPageQueryResult} from './queries'
import {Sections} from './Sections'
import {useUiStrings} from './uiStrings'

interface Loaded {
  key: string
  result: LandingPageQueryResult
}

interface Failed {
  key: string
  error: unknown
}

export function HomePage() {
  const {variant, lang, setDebugInfo} = useDemoState()
  const t = useUiStrings()
  const [loaded, setLoaded] = useState<Loaded | undefined>(undefined)
  const [failed, setFailed] = useState<Failed | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const key = `${variant}::${lang}`
    const requestOptions = {...(variant ? {variant} : {}), lang}
    client
      .fetch<LandingPageQueryResult>(
        LANDING_PAGE_QUERY,
        {id: LANDING_PAGE_ID, lang},
        {...(variant ? {variant} : {}), stega: false},
      )
      .then((result) => {
        if (cancelled) return
        setLoaded({key, result})
        setDebugInfo({requestOptions, response: result})
      })
      .catch((error) => {
        if (cancelled) return
        setFailed({key, error})
        setDebugInfo({requestOptions, response: {error: queryErrorMessage(error)}})
      })
    return () => {
      cancelled = true
    }
  }, [variant, lang, setDebugInfo])

  const requestKey = `${variant}::${lang}`
  const data = loaded?.key === requestKey ? loaded.result : undefined
  const error = failed?.key === requestKey ? failed.error : undefined
  const loading = !data && !error

  const page = data?.page
  const latestProducts = data?.latestProducts ?? []

  return (
    <main>
      {loading && <LoadingBlock />}
      {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
      {!loading && !error && !page && <EmptyBlock message={t.noLandingPage} />}
      {!loading && !error && page ? (
        <Sections page={page} latestProducts={latestProducts} activeVariant={variant} />
      ) : null}
    </main>
  )
}
