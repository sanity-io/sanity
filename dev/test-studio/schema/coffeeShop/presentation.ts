import {defineDocuments, defineLocations} from 'sanity/presentation'

/** Shared Presentation resolve config for the Brew & Bean coffee shop preview iframe. */
export const coffeeShopPresentationResolve = {
  mainDocuments: defineDocuments([
    {
      route: '/',
      filter: `_type == "demoCoffeeLandingPage"`,
    },
    {
      route: '/products/:slug',
      filter: `_type == "demoCoffeeProduct" && slug.current == $slug`,
    },
    {
      route: '/loyalty',
      filter: `_type == "demoCoffeeLoyaltyPage"`,
    },
  ]),
  locations: {
    demoCoffeeLandingPage: defineLocations({
      select: {title: 'title'},
      resolve: (doc) => ({
        locations: [{title: doc?.title || 'Landing', href: '/'}],
      }),
    }),
    demoCoffeeProduct: defineLocations({
      select: {title: 'title', slug: 'slug.current'},
      resolve: (doc) => {
        if (!doc?.slug) return {}
        return {
          locations: [{title: doc.title || 'Product', href: `/products/${doc.slug}`}],
        }
      },
    }),
    demoCoffeeLoyaltyPage: defineLocations({
      select: {title: 'title'},
      resolve: (doc) => ({
        locations: [{title: doc?.title || 'Loyalty', href: '/loyalty'}],
      }),
    }),
  },
}

export const coffeeShopPreviewUrl = {
  origin:
    process.env.SANITY_STUDIO_PREVIEW_IFRAME_ORIGIN ??
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3334'
      : 'https://test-studio-preview-iframe-git-cursor-coffee-shop-presen-764c1b.sanity.dev'),
  preview: '/',
} as const
