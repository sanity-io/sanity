import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {useEffect, useState} from 'react'
import {Link, useParams} from 'react-router-dom'

import {CoverImage, EmptyBlock, ErrorBlock, LoadingBlock, queryErrorMessage} from './components'
import {useDemoState} from './demoState'
import {client} from './loader'
import {ARTICLE_DETAIL_QUERY, type ArticleDetail} from './queries'
import {useUiStrings} from './uiStrings'

interface Loaded {
  key: string
  result: ArticleDetail | null
}

interface Failed {
  key: string
  error: unknown
}

function Prose({text}: {text?: string}) {
  return (
    <div className="prose">
      {(text ?? '')
        .split('\n\n')
        .filter(Boolean)
        .map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
    </div>
  )
}

export function ArticlePage() {
  const {slug = ''} = useParams<{slug: string}>()
  const {variant, lang, setDebugInfo} = useDemoState()
  const t = useUiStrings()
  const [loaded, setLoaded] = useState<Loaded | undefined>(undefined)
  const [failed, setFailed] = useState<Failed | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const key = `${slug}::${variant}::${lang}`
    const params = {slug, lang}
    const requestOptions = {...(variant ? {variant} : {}), stega: false}
    client
      .fetch<ArticleDetail | null>(ARTICLE_DETAIL_QUERY, params, requestOptions)
      .then((result) => {
        if (cancelled) return
        setLoaded({key, result})
        setDebugInfo({query: ARTICLE_DETAIL_QUERY, params, requestOptions, response: result})
      })
      .catch((error) => {
        if (cancelled) return
        setFailed({key, error})
        setDebugInfo({
          query: ARTICLE_DETAIL_QUERY,
          params,
          requestOptions,
          response: {error: queryErrorMessage(error)},
        })
      })
    return () => {
      cancelled = true
    }
  }, [slug, variant, lang, setDebugInfo])

  const requestKey = `${slug}::${variant}::${lang}`
  const settled = loaded?.key === requestKey || failed?.key === requestKey
  const data = loaded?.key === requestKey ? loaded.result : undefined
  const error = failed?.key === requestKey ? failed.error : undefined
  const loading = !settled

  const attr = data ? createDataAttribute({id: data._id, type: 'politicoArticle'}) : null
  const memberHasFullAnalysis = Boolean(data?.memberAnalysis?.body)

  return (
    <main className="article-page">
      <p className="back-link">
        <Link to="/">{t.backToHome}</Link>
      </p>

      {loading && <LoadingBlock />}
      {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
      {!loading && !error && !data && <EmptyBlock message={t.articleNotFound} />}

      {!loading && !error && data && attr ? (
        <article>
          <div className="article-hero">
            {data.section && <span className="section-tag">{data.section}</span>}
            {data.kicker && (
              <p className="kicker" data-sanity={attr.scope('kicker').toString()}>
                {data.kicker}
              </p>
            )}
            <h1 data-sanity={attr.scope('headline').toString()}>{data.headline || 'Untitled'}</h1>
            {data.dek && (
              <p className="dek" data-sanity={attr.scope('dek').toString()}>
                {data.dek}
              </p>
            )}
            {data.byline && <p className="byline">{data.byline}</p>}
            <div data-sanity={attr.scope('heroImage').toString()}>
              <CoverImage imageUrl={data.imageUrl} title={data.headline} variant="hero" />
            </div>
          </div>

          <div data-sanity={attr.scope('body').toString()}>
            <Prose text={data.body} />
          </div>

          {data.contextBox ? (
            <aside className="context-box" data-sanity={attr.scope('contextBox').toString()}>
              {data.contextBox.heading && <h3>{data.contextBox.heading}</h3>}
              <Prose text={data.contextBox.body} />
            </aside>
          ) : null}

          {data.sponsoredInsert ? (
            <aside
              className="sponsored-insert"
              data-sanity={attr.scope('sponsoredInsert').toString()}
            >
              <span className="sponsored-label">{t.sponsoredLabel}</span>
              <h3>{data.sponsoredInsert.headline}</h3>
              <p>{data.sponsoredInsert.body}</p>
              {data.sponsoredInsert.ctaLabel && (
                <span className="button button-accent">{data.sponsoredInsert.ctaLabel}</span>
              )}
            </aside>
          ) : null}

          {data.memberAnalysis ? (
            <section
              className="member-analysis"
              data-sanity={attr.scope('memberAnalysis').toString()}
            >
              <span className="pro-label">{t.proLabel}</span>
              <h2>{data.memberAnalysis.heading}</h2>
              {memberHasFullAnalysis ? (
                <Prose text={data.memberAnalysis.body} />
              ) : (
                <div className="pro-teaser">
                  <p>{data.memberAnalysis.teaser}</p>
                  <span className="button button-accent">{t.proTeaserCta}</span>
                </div>
              )}
            </section>
          ) : null}
        </article>
      ) : null}
    </main>
  )
}
