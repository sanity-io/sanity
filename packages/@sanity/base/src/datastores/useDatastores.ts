import {useMemo} from 'react'
import {SanityClient} from '@sanity/client'
import {fromSanityClient} from '@sanity/bifur-client'
import {useClient} from '../client'
import {SanityConfig, useConfig} from '../config'
import {SanitySource, useSource} from '../source'
import {Datastores, DatastoresContext} from './types'
import {createDatastores} from './datastores'

const datastoresCache = (() => {
  const map0 = new WeakMap<SanityClient, WeakMap<SanityConfig, WeakMap<SanitySource, Datastores>>>()

  function get(context: DatastoresContext): Datastores | undefined {
    return map0.get(context.client)?.get(context.config)?.get(context.source)
  }

  function set(context: DatastoresContext, datastores: Datastores) {
    const map1 = map0.get(context.client) || new WeakMap()

    map0.set(context.client, map1)

    const map2 = map1.get(context.config) || new WeakMap()

    map1.set(context.config, map2)
    map2.set(context.source, datastores)
  }

  return {get, set}
})()

export function useDatastores(): Datastores {
  const config = useConfig()
  const client = useClient()
  const source = useSource()

  return useMemo(() => {
    const bifur = fromSanityClient(client as any)
    const context = {bifur, client, config, source}
    const cachedDatastores = datastoresCache.get(context)

    if (cachedDatastores) {
      return cachedDatastores
    }

    const datastores = createDatastores(context)

    datastoresCache.set(context, datastores)

    return datastores
  }, [client, config, source])
}
