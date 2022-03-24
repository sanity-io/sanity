import {useMemo} from 'react'
import {SanityConfig, useConfig} from '../config'
import {SanitySource, useSource} from '../source'
import {Datastores, DatastoresContext} from './types'
import {createDatastores} from './datastores'

const datastoresCache = (() => {
  const map0 = new WeakMap<SanityConfig, WeakMap<SanitySource, Datastores>>()

  function get(context: DatastoresContext): Datastores | undefined {
    return map0.get(context.config)?.get(context.source)
  }

  function set(context: DatastoresContext, datastores: Datastores) {
    const map1 = map0.get(context.config) || new WeakMap()

    if (!map0.has(context.config)) {
      map0.set(context.config, map1)
    }

    map1.set(context.source, datastores)
  }

  return {get, set}
})()

export function useDatastores(): Datastores {
  const config = useConfig()
  const source = useSource()

  return useMemo(() => {
    const context: DatastoresContext = {config, source}
    const cachedDatastores = datastoresCache.get(context)

    if (cachedDatastores) {
      return cachedDatastores
    }

    const datastores = createDatastores(context)

    datastoresCache.set(context, datastores)

    return datastores
  }, [config, source])
}
