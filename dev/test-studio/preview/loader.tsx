import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import {createQueryStore} from '@sanity/react-loader'

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'playground',
  useCdn: true,
  apiVersion: 'X',
  stega: {
    enabled: true,
    studioUrl: '/presentation',
    // logger: console,
    filter: (props) => {
      return props.filterDefault(props)
    },
  },
})

export const {useQuery, useLiveMode} = createQueryStore({client})
export const imageBuilder: ReturnType<typeof imageUrlBuilder> = imageUrlBuilder(client)
