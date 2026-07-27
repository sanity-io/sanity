import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {Link} from 'react-router-dom'

import {CoverImage, ProductCard, RichText} from './components'
import {type CoffeeProductCard, type LandingPage, type LandingSection} from './queries'

function sectionAttr(pageId: string, sectionKey: string, field?: string) {
  const path = field
    ? `sections[_key=="${sectionKey}"].${field}`
    : `sections[_key=="${sectionKey}"]`
  return createDataAttribute({id: pageId, type: 'demoCoffeeLandingPage'}).scope(path).toString()
}

function HeroSection({pageId, section}: {pageId: string; section: LandingSection}) {
  return (
    <section className="hero" data-sanity={sectionAttr(pageId, section._key)}>
      <div className="hero-copy">
        <h1 data-sanity={sectionAttr(pageId, section._key, 'headline')}>
          {section.headline || 'Brew & Bean'}
        </h1>
        {section.subheadline && (
          <p className="hero-sub" data-sanity={sectionAttr(pageId, section._key, 'subheadline')}>
            {section.subheadline}
          </p>
        )}
        {section.ctaLabel && (
          <a
            className="button"
            href="#featured"
            data-sanity={sectionAttr(pageId, section._key, 'ctaLabel')}
          >
            {section.ctaLabel}
          </a>
        )}
      </div>
      <div className="hero-media" data-sanity={sectionAttr(pageId, section._key, 'image')}>
        <CoverImage imageUrl={section.imageUrl} title={section.headline} variant="hero" />
      </div>
    </section>
  )
}

function FeaturedProductsSection({
  pageId,
  section,
  latestProducts,
}: {
  pageId: string
  section: LandingSection
  latestProducts: CoffeeProductCard[]
}) {
  const products =
    section.products && section.products.length > 0 ? section.products : latestProducts

  return (
    <section className="section" id="featured" data-sanity={sectionAttr(pageId, section._key)}>
      <h2 data-sanity={sectionAttr(pageId, section._key, 'heading')}>
        {section.heading || 'Our coffees'}
      </h2>
      {products.length === 0 ? (
        <p className="muted">No products yet — run the Seed coffee shop tool in the studio.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

function PromoBannerSection({pageId, section}: {pageId: string; section: LandingSection}) {
  const title = section.title || section.promo?.title
  const tagline = section.tagline || section.promo?.tagline
  const cta = section.ctaLabel || section.promo?.ctaLabel

  return (
    <section className="promo-banner" data-sanity={sectionAttr(pageId, section._key)}>
      <div>
        <h2 data-sanity={sectionAttr(pageId, section._key, 'title')}>{title || 'Special offer'}</h2>
        {tagline && <p data-sanity={sectionAttr(pageId, section._key, 'tagline')}>{tagline}</p>}
      </div>
      {cta && (
        <Link
          className="button button-accent"
          to="/#featured"
          data-sanity={sectionAttr(pageId, section._key, 'ctaLabel')}
        >
          {cta}
        </Link>
      )}
    </section>
  )
}

function StorySection({pageId, section}: {pageId: string; section: LandingSection}) {
  return (
    <section className="section story" data-sanity={sectionAttr(pageId, section._key)}>
      <div className="story-copy">
        <h2 data-sanity={sectionAttr(pageId, section._key, 'heading')}>
          {section.heading || 'Our story'}
        </h2>
        <div data-sanity={sectionAttr(pageId, section._key, 'body')}>
          {Array.isArray(section.body) ? (
            <RichText value={section.body} />
          ) : (
            section.body && <p>{section.body}</p>
          )}
        </div>
      </div>
      <div className="story-media" data-sanity={sectionAttr(pageId, section._key, 'image')}>
        <CoverImage imageUrl={section.imageUrl} title={section.heading} variant="detail" />
      </div>
    </section>
  )
}

function OriginsSection({pageId, section}: {pageId: string; section: LandingSection}) {
  return (
    <section className="section" data-sanity={sectionAttr(pageId, section._key)}>
      <h2 data-sanity={sectionAttr(pageId, section._key, 'heading')}>
        {section.heading || 'Origins'}
      </h2>
      <div className="origins-grid">
        {(section.origins || []).map((origin) => (
          <article key={origin._id} className="origin-card">
            <CoverImage imageUrl={origin.imageUrl} title={origin.name} />
            <div>
              <h3>{origin.name}</h3>
              {origin.region && <p className="muted">{origin.region}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function CtaSection({pageId, section}: {pageId: string; section: LandingSection}) {
  return (
    <section className="cta-section" data-sanity={sectionAttr(pageId, section._key)}>
      <h2 data-sanity={sectionAttr(pageId, section._key, 'heading')}>
        {section.heading || 'Ready?'}
      </h2>
      {section.body && (
        <p data-sanity={sectionAttr(pageId, section._key, 'body')}>
          {typeof section.body === 'string' ? section.body : null}
        </p>
      )}
      {section.buttonLabel && (
        <a
          className="button"
          href="#featured"
          data-sanity={sectionAttr(pageId, section._key, 'buttonLabel')}
        >
          {section.buttonLabel}
        </a>
      )}
    </section>
  )
}

export function Sections({
  page,
  latestProducts,
}: {
  page: LandingPage
  latestProducts: CoffeeProductCard[]
}) {
  return (
    <>
      {(page.sections || []).map((section) => {
        switch (section._type) {
          case 'hero':
            return <HeroSection key={section._key} pageId={page._id} section={section} />
          case 'featuredProducts':
            return (
              <FeaturedProductsSection
                key={section._key}
                pageId={page._id}
                section={section}
                latestProducts={latestProducts}
              />
            )
          case 'promoBanner':
            return <PromoBannerSection key={section._key} pageId={page._id} section={section} />
          case 'story':
            return <StorySection key={section._key} pageId={page._id} section={section} />
          case 'origins':
            return <OriginsSection key={section._key} pageId={page._id} section={section} />
          case 'cta':
            return <CtaSection key={section._key} pageId={page._id} section={section} />
          default:
            return null
        }
      })}
    </>
  )
}
