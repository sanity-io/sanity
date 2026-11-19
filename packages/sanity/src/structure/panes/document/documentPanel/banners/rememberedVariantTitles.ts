import {useEffect} from 'react'
import {getVariantTitle, useAllVariants} from 'sanity'

const VARIANT_ID_PREFIX = '_.variants.'

/**
 * The titles of the variant definitions seen this session, by variant name (the id without its
 * `_.variants.` prefix). A variant deleted later is then still named by its title, never by its id.
 */
const titles = new Map<string, string>()

const variantName = (id: string) =>
  id.startsWith(VARIANT_ID_PREFIX) ? id.slice(VARIANT_ID_PREFIX.length) : id

/** Records the titles of the variant definitions in the workspace, for the variant-not-found banner. */
export function useRememberVariantTitles(): void {
  const {data: variants} = useAllVariants()
  useEffect(() => {
    for (const variant of variants) titles.set(variantName(variant._id), getVariantTitle(variant))
  }, [variants])
}

/** The title of a variant seen this session, or `undefined` when it was never seen. */
export function getRememberedVariantTitle(name: string): string | undefined {
  return titles.get(variantName(name))
}
