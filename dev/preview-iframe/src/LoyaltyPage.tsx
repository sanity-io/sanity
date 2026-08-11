import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'

import {EmptyBlock, ErrorBlock, LoadingBlock, queryErrorMessage} from './components'
import {useDemoState} from './demoState'
import {client} from './loader'
import {type LoyaltyPage as LoyaltyPageData, LOYALTY_PAGE_ID, LOYALTY_PAGE_QUERY} from './queries'
import {useUiStrings} from './uiStrings'

interface Loaded {
  key: string
  result: LoyaltyPageData | null
}

interface Failed {
  key: string
  error: unknown
}

// Gated by the "Loyalty page" feature flag: the base document holds a
// "coming soon" placeholder, the flag-scoped variant holds the real perks
// copy — a flag gating an entire page's content, not just a section.
export function LoyaltyPage() {
  const {variant, lang, setDebugInfo} = useDemoState()
  const t = useUiStrings()
  const [loaded, setLoaded] = useState<Loaded | undefined>(undefined)
  const [failed, setFailed] = useState<Failed | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const key = `${variant}::${lang}`
    const params = {id: LOYALTY_PAGE_ID, lang}
    const requestOptions = {...(variant ? {variant} : {}), stega: false}
    client
      .fetch<LoyaltyPageData | null>(LOYALTY_PAGE_QUERY, params, requestOptions)
      .then((result) => {
        if (cancelled) return
        setLoaded({key, result})
        setDebugInfo({query: LOYALTY_PAGE_QUERY, params, requestOptions, response: result})
      })
      .catch((error) => {
        if (cancelled) return
        setFailed({key, error})
        setDebugInfo({
          query: LOYALTY_PAGE_QUERY,
          params,
          requestOptions,
          response: {error: queryErrorMessage(error)},
        })
      })
    return () => {
      cancelled = true
    }
  }, [variant, lang, setDebugInfo])

  const requestKey = `${variant}::${lang}`
  const settled = loaded?.key === requestKey || failed?.key === requestKey
  const data = loaded?.key === requestKey ? loaded.result : undefined
  const error = failed?.key === requestKey ? failed.error : undefined
  const loading = !settled

  const attr = data ? createDataAttribute({id: data._id, type: 'demoCoffeeLoyaltyPage'}) : null

  return (
    <main className="loyalty-page">
      <p className="back-link">
        <Link to="/">{t.backToAllCoffees}</Link>
      </p>

      {loading && <LoadingBlock />}
      {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
      {!loading && !error && !data && <EmptyBlock message={t.noLoyaltyPage} />}

      {!loading && !error && data && attr ? (
        <article>
          <h1 data-sanity={attr.scope('heading').toString()}>{data.heading || data.title}</h1>
          {data.body && <p data-sanity={attr.scope('body').toString()}>{data.body}</p>}
          {data.ctaLabel && (
            <span className="button" data-sanity={attr.scope('ctaLabel').toString()}>
              {data.ctaLabel}
            </span>
          )}
        </article>
      ) : null}
    </main>
  )
}
