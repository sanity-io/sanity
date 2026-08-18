import {createClient} from '@sanity/client'
import {createImageUrlBuilder, type ImageUrlBuilder} from '@sanity/image-url'
import {createQueryStore} from '@sanity/react-loader'

const studioUrl =
  import.meta.env.SANITY_STUDIO_URL ??
  (import.meta.env.DEV ? 'http://localhost:3333/test' : 'https://test-studio.sanity.dev/test')

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  useCdn: true,
  apiVersion: '2025-03-19',
  stega: {enabled: true, studioUrl},
})

export const {useQuery, useLiveMode} = createQueryStore({
  // @ts-expect-error -- `@sanity/react-loader` pins `@sanity/client@^7`, so two copies of the
  // package are installed and its `createQueryStore` is typed against the v7 `SanityClient`.
  // `SanityClient` carries an ES private field, which TypeScript compares nominally, so the two
  // copies are never assignable to each other even though the API we use here is identical.
  // Remove once the loader chain supports `@sanity/client@^8`.
  client,
})
export const imageBuilder: ImageUrlBuilder = createImageUrlBuilder(client)
