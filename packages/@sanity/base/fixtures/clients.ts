import createClient from '@sanity/client'

export const clientV1 = createClient({
  // eslint-disable-next-line no-process-env
  token: process.env.CYPRESS_SANITY_SESSION_TOKEN,
  apiVersion: '1',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  useCdn: false,
  ignoreBrowserTokenWarning: true,
})
