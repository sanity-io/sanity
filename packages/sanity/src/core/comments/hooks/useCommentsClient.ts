import {SanityClient, createClient} from '@sanity/client'
import {useMemo} from 'react'
import {useWorkspace} from '../../studio'

export function useCommentsClient(): SanityClient {
  const {dataset, projectId} = useWorkspace()

  // Initialize client scoped to adjacent metacontent dataset
  const client = useMemo(() => {
    return createClient({
      apiVersion: 'v2022-05-09',
      dataset: `${dataset}-metacontent-comments`,
      projectId,
      requestTagPrefix: 'sanity.studio',
      useCdn: false,
      withCredentials: true,
    })
  }, [dataset, projectId])

  return client
}
