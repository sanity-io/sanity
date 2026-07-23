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

export const {useQuery, useLiveMode} = createQueryStore({client})
export const imageBuilder: ImageUrlBuilder = createImageUrlBuilder(client)
