import sanityClient from '@sanity/client'

const testSanityClient = sanityClient({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  token: Cypress.env('SANITY_SESSION_TOKEN'),
  useCdn: false,
})

export default testSanityClient
