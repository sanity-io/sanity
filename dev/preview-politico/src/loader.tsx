import {createClient} from '@sanity/client'
import {createImageUrlBuilder, type ImageUrlBuilder} from '@sanity/image-url'
import {createQueryStore} from '@sanity/react-loader'

const studioUrl =
  import.meta.env.SANITY_STUDIO_URL ??
  (import.meta.env.DEV
    ? 'http://localhost:3333/politico'
    : 'https://test-studio.sanity.dev/politico')

const client = createClient({
  projectId: 'ttfgug5v',
  dataset: 'production',
  // Variant queries aren't served through the CDN yet — bypass it so `variant` takes effect.
  useCdn: false,
  // The `variant` query option requires the experimental API version during closed beta.
  apiVersion: 'X',
  stega: {enabled: true, studioUrl},
  // DEMO ONLY: anonymous requests can't resolve variant-scoped references during closed
  // beta (see docs/initiatives/content-variants-closed-beta-gotchas.md #5). Never ship a
  // token in a public storefront bundle — this is fine for a local-only dev demo only.
  token: import.meta.env.SANITY_VIEWER_TOKEN,
})

export const {useQuery, useLiveMode} = createQueryStore({client})
export {client, studioUrl}
export const imageBuilder: ImageUrlBuilder = createImageUrlBuilder(client)
