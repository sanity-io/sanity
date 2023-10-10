import {SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useClient, useWorkspace} from 'sanity'

export function useCommentsClient(): SanityClient {
  const {dataset, projectId} = useWorkspace()
  const originalClient = useClient()
  // Initialize client scoped to adjacent metacontent dataset
  // It's a clone of the default client for the studio,
  // in order to have the authentication properly configured
  // based on cookie support (use JWT auth if cookies are not supported)
  const client = useMemo(() => {
    return originalClient.withConfig({
      apiVersion: 'v2022-05-09',
      dataset: `${dataset}-metacontent-comments`,
      projectId,
      requestTagPrefix: 'sanity.studio',
      useCdn: false,
      withCredentials: true,
    })
  }, [dataset, originalClient, projectId])

  return client
}
