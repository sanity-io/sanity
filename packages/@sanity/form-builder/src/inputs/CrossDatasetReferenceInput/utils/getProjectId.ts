import sanityClient from 'part:@sanity/base/client'

export const getProjectId: () => string = () => {
  const client = sanityClient.withConfig({apiVersion: '2021-06-07'}).clone()
  return client.config().projectId
}
