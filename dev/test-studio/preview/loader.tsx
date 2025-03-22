import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import {createQueryStore} from '@sanity/react-loader'

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  useCdn: true,
  apiVersion: '2025-03-19',
  stega: {enabled: true, studioUrl: '/presentation'},
})

export const {useQuery, useLiveMode} = createQueryStore({client})
export const imageBuilder: ReturnType<typeof imageUrlBuilder> = imageUrlBuilder(client)
