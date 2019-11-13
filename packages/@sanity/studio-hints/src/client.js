import SanityClient from '@sanity/client'

export default new SanityClient({
  projectId: '3do82whm',
  dataset: 'next',
  useCdn: false // switch this to true when we're out of dev mode
})
