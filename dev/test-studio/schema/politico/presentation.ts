import {defineDocuments, defineLocations} from 'sanity/presentation'

/** Shared Presentation resolve config for the POLITICO preview iframe. */
export const politicoPresentationResolve = {
  mainDocuments: defineDocuments([
    {
      route: '/',
      filter: `_type == "politicoHomePage"`,
    },
    {
      route: '/story/:slug',
      filter: `_type == "politicoArticle" && slug.current == $slug`,
    },
  ]),
  locations: {
    politicoHomePage: defineLocations({
      select: {title: 'title'},
      resolve: (doc) => ({
        locations: [{title: doc?.title || 'Home', href: '/'}],
      }),
    }),
    politicoArticle: defineLocations({
      select: {title: 'headline.0.value', slug: 'slug.current'},
      resolve: (doc) => {
        if (!doc?.slug) return {}
        return {
          locations: [{title: doc.title || 'Article', href: `/story/${doc.slug}`}],
        }
      },
    }),
  },
}

export const politicoPreviewUrl = {
  origin:
    process.env.SANITY_STUDIO_POLITICO_PREVIEW_ORIGIN ??
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3335'
      : 'https://test-studio-preview-politico-git-cursor-coffee-shop-presen-764c1b.sanity.dev'),
  preview: '/',
} as const
