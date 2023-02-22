import {createClient} from '@sanity/client'

const testSanityClient = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  token: Cypress.env('SANITY_SESSION_TOKEN'),
  useCdn: false,
})

export default testSanityClient
