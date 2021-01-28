import createClient from '@sanity/client'

const TOKEN = process.env.SANITY_PERF_STUDIO_WRITE_TOKEN

export const sanity = createClient({
  token: TOKEN,
  projectId: 'ppsg7ml5',
  dataset: 'perf',
  useCdn: false,
})
