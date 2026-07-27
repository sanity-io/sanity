import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {Link, useParams} from 'react-router-dom'

import {
  CoverImage,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  ProductCard,
  ProductPrice,
  queryErrorMessage,
  RichText,
  SiteHeader,
} from './components'
import {useQuery} from './loader'
import {type CoffeeProductDetail, PRODUCT_DETAIL_QUERY} from './queries'

export function ProductPage() {
  const {slug = ''} = useParams<{slug: string}>()
  const {data, loading, error} = useQuery<CoffeeProductDetail | null>(PRODUCT_DETAIL_QUERY, {
    slug,
  })

  const attr = data ? createDataAttribute({id: data._id, type: 'demoCoffeeProduct'}) : null

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="product-page">
        <p className="back-link">
          <Link to="/">← All coffees</Link>
        </p>

        {loading && <LoadingBlock />}
        {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
        {!loading && !error && !data && (
          <EmptyBlock message="This product was not found for the current perspective." />
        )}

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
                    <ProductPrice price={data.price} discount={data.discount} />
                  </span>
                </div>
                <h1 data-sanity={attr.scope('title').toString()}>{data.title || 'Untitled'}</h1>
                <p className="muted" data-sanity={attr.scope('origin').toString()}>
                  {data.origin?.name
                    ? `Roasted from ${data.origin.name}${data.origin.region ? `, ${data.origin.region}` : ''}`
                    : 'Origin unknown'}
                </p>
                {data.excerpt ? (
                  <p className="lead" data-sanity={attr.scope('excerpt').toString()}>
                    {data.excerpt}
                  </p>
                ) : null}
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
                <h2>You might also like</h2>
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
    </div>
  )
}
