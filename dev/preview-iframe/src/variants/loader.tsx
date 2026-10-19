import {createClient} from '@sanity/client'
import {createQueryStore} from '@sanity/react-loader'

// The Variants 2.0 stand-in preview reads the `variants-2-0` dataset (private). The page holds NO token: inside
// Presentation the Studio answers the queries through the loader (`useLiveMode`), with the editor's own session.
const studioUrl = import.meta.env.SANITY_STUDIO_URL ?? 'http://localhost:3350'

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'variants-2-0',
  useCdn: false,
  apiVersion: 'X',
  stega: {enabled: true, studioUrl},
})

export const {useQuery, useLiveMode} = createQueryStore({client})
