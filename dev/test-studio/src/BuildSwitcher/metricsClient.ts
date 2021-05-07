import createClient from '@sanity/client'

export const metricsStudioClient = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'metrics',
  apiVersion: '2021-05-07',
  useCdn: false,
})
