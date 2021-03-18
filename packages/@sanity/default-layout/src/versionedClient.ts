import client from 'part:@sanity/base/client'

export const versionedClient = client.withConfig({apiVersion: '1'})
