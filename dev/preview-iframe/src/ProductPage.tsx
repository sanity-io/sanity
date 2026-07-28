import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {useEffect, useState} from 'react'
import {Link, useParams} from 'react-router-dom'

import {
  CoverImage,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  ProductCard,
  ProductOptions,
  ProductPrice,
  queryErrorMessage,
  RichText,
} from './components'
import {useDemoState} from './demoState'
import {client} from './loader'
import {type CoffeeProductDetail, PRODUCT_DETAIL_QUERY} from './queries'
import {useUiStrings} from './uiStrings'

interface Loaded {
  key: string
  result: CoffeeProductDetail | null
}

interface Failed {
  key: string
  error: unknown
}

export function ProductPage() {
  const {slug = ''} = useParams<{slug: string}>()
  const {variant, lang, setDebugInfo} = useDemoState()
  const t = useUiStrings()
  const [loaded, setLoaded] = useState<Loaded | undefined>(undefined)
  const [failed, setFailed] = useState<Failed | undefined>(undefined)
  const [sizeIndex, setSizeIndex] = useState(0)
  const [grind, setGrind] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const key = `${slug}::${variant}::${lang}`
    const requestOptions = {...(variant ? {variant} : {}), lang}
    client
      .fetch<CoffeeProductDetail | null>(
        PRODUCT_DETAIL_QUERY,
        {slug, lang},
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
  }, [slug, variant, lang, setDebugInfo])

  const requestKey = `${slug}::${variant}::${lang}`
  const settled = loaded?.key === requestKey || failed?.key === requestKey
  const data = loaded?.key === requestKey ? loaded.result : undefined
  const error = failed?.key === requestKey ? failed.error : undefined
  const loading = !settled

  const attr = data ? createDataAttribute({id: data._id, type: 'demoCoffeeProduct'}) : null
  const selectedSize = data?.sizeOptions?.[sizeIndex]
  const displayPrice = selectedSize?.price ?? data?.price

  return (
    <main className="product-page">
      <p className="back-link">
        <Link to="/">{t.backToAllCoffees}</Link>
      </p>

      {loading && <LoadingBlock />}
      {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
      {!loading && !error && !data && <EmptyBlock message={t.productNotFound} />}

      {!loading && !error && data && attr ? (
        <article>
          <div className="product-hero">
            <div data-sanity={attr.scope('image').toString()}>
              <CoverImage imageUrl={data.imageUrl} title={data.title} variant="detail" />
            </div>
            <div className="product-hero-copy">
              <div className="product-card-meta">
                {typeof data.discount === 'number' && data.discount > 0 ? (
                  <span className="badge" data-sanity={attr.scope('discount').toString()}>
                    {data.discount}% off
                  </span>
                ) : null}
                <span data-sanity={attr.scope('price').toString()}>
                  <ProductPrice price={displayPrice} discount={data.discount} />
                </span>
              </div>
              <h1 data-sanity={attr.scope('title').toString()}>{data.title || 'Untitled'}</h1>
              <p className="muted" data-sanity={attr.scope('origin').toString()}>
                {data.origin?.name
                  ? t.originRoastedFrom(data.origin.name, data.origin.region)
                  : t.originUnknown}
              </p>
              {data.excerpt ? (
                <p className="lead" data-sanity={attr.scope('excerpt').toString()}>
                  {data.excerpt}
                </p>
              ) : null}
              <ProductOptions
                sizeOptions={data.sizeOptions}
                grindOptions={data.grindOptions}
                sizeIndex={sizeIndex}
                onSizeChange={setSizeIndex}
                grind={grind}
                onGrindChange={setGrind}
              />
            </div>
          </div>

          <div data-sanity={attr.scope('description').toString()}>
            <RichText value={data.description} />
          </div>

          {data.promo ? (
            <aside className="promo-banner" data-sanity={attr.scope('promo').toString()}>
              <div>
                <h2>{data.promo.title || 'Special offer'}</h2>
                {data.promo.tagline ? <p>{data.promo.tagline}</p> : null}
              </div>
              {data.promo.ctaLabel ? (
                <span className="button button-accent">{data.promo.ctaLabel}</span>
              ) : null}
            </aside>
          ) : null}

          {(data.relatedProducts?.length ?? 0) > 0 ? (
            <section className="section">
              <h2>{t.relatedProducts}</h2>
              <div className="product-grid">
                {data.relatedProducts!.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </section>
          ) : null}
        </article>
      ) : null}
    </main>
  )
}
