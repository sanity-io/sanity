import sanityClient from 'part:@sanity/base/client'

export const versionedClient = sanityClient.withConfig({
  apiVersion: '1',
})
