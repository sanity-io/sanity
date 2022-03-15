import createSanityClient, {SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {SanitySource, useSource} from '../source'

const clientCache = new WeakMap<SanitySource, SanityClient>()

export function useClient(): SanityClient {
  const source = useSource()

  return useMemo(() => {
    const cached = clientCache.get(source)

    if (cached) return cached

    const client = createSanityClient({
      projectId: source.projectId,
      dataset: source.dataset,
      apiVersion: '1',
      requestTagPrefix: 'sanity.studio',
      useCdn: false,
      withCredentials: true,
    })

    clientCache.set(source, client)

    return client
  }, [source])
}
