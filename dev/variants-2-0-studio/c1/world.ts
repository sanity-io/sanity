import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {useOptionState} from '../options/store'
import {deriveDimensions, type DimensionSpec, type SystemVariant} from './model'

const DEFINITIONS_GROQ = `*[_type == "system.variant"]{_id, conditions, priority, metadata}`
const cache = new Map<string, Promise<SystemVariant[]>>()

/**
 * LIVE: the variant definitions of the dataset (raw perspective, apiVersion X), which replace the Storybook
 * fixtures' `V2World`. Reloaded on window focus so a newly created definition shows up.
 */
export function useVariantDefinitions(): SystemVariant[] {
  const studioClient = useClient({apiVersion: 'X'})
  const [variants, setVariants] = useState<SystemVariant[]>([])

  useEffect(() => {
    const {projectId, dataset} = studioClient.config()
    const key = `${projectId}/${dataset}`
    let cancelled = false
    const load = (fresh: boolean) => {
      if (fresh) cache.delete(key)
      let pending = cache.get(key)
      if (!pending) {
        pending = studioClient.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}).fetch(DEFINITIONS_GROQ)
        cache.set(key, pending)
      }
      pending.then((next) => !cancelled && setVariants(next)).catch(() => !cancelled && setVariants([]))
    }
    load(false)
    const onFocus = () => load(true)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [studioClient])

  return variants
}

/** The dimensions the definitions use, limited to the first N by the Config panel (design control, no data change). */
export function useDimensions(): DimensionSpec[] {
  const variants = useVariantDefinitions()
  const {dimensionLimit, stage} = useOptionState()
  const all = deriveDimensions(variants)
  // Open beta: exactly one dimension, the first. GA: all of them (the limit is a comparison aid).
  if (stage === 'open-beta') return all.slice(0, 1)
  return dimensionLimit === null ? all : all.slice(0, dimensionLimit)
}
