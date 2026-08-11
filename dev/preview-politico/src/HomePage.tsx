import {useEffect, useState} from 'react'

import {ArticleCard, EmptyBlock, ErrorBlock, LoadingBlock, queryErrorMessage} from './components'
import {useDemoState} from './demoState'
import {client} from './loader'
import {HOME_PAGE_ID, HOME_PAGE_QUERY, type HomePageQueryResult} from './queries'
import {useUiStrings} from './uiStrings'

interface Loaded {
  key: string
  result: HomePageQueryResult
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
    const params = {id: HOME_PAGE_ID, lang}
    const requestOptions = {...(variant ? {variant} : {}), stega: false}
    client
      .fetch<HomePageQueryResult>(HOME_PAGE_QUERY, params, requestOptions)
      .then((result) => {
        if (cancelled) return
        setLoaded({key, result})
        setDebugInfo({query: HOME_PAGE_QUERY, params, requestOptions, response: result})
      })
      .catch((error) => {
        if (cancelled) return
        setFailed({key, error})
        setDebugInfo({
          query: HOME_PAGE_QUERY,
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
  const data = loaded?.key === requestKey ? loaded.result : undefined
  const error = failed?.key === requestKey ? failed.error : undefined
  const loading = !data && !error

  const page = data?.page
  const featured =
    page?.featured && page.featured.length > 0 ? page.featured : (data?.latestArticles ?? [])

  return (
    <main>
      {loading && <LoadingBlock />}
      {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
      {!loading && !error && !page && <EmptyBlock message={t.noHomePage} />}
      {!loading && !error && page ? (
        <section className="section">
          <div className="article-grid">
            {featured.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
