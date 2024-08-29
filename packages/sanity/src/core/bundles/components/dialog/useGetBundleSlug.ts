import {useCallback} from 'react'
import speakingurl from 'speakingurl'

import {useBundles} from '../../../store/bundles'

const PROTECTED_SLUGS = ['drafts', 'published']

const NO_EXISTING_SLUG: number = 0

export function useGetBundleSlug() {
  const {data: bundles} = useBundles()

  // From existing bundles:
  // if slug doesn't exist, return NO_EXISTING_SLUG
  // if slug does exist, returns lowest suffix number available
  const getMinimumAvailableSuffixForSlug = useCallback(
    (baseSlug: string): number => {
      if (!bundles) return NO_EXISTING_SLUG

      const suffixRegex = new RegExp(`^${baseSlug}(?:-(\\d+))?$`)
      const descExistingSlugSuffixes = [...bundles, ...PROTECTED_SLUGS.map((slug) => ({slug}))]
        .reduce<number[]>((existingSuffixes, {slug: existingBundleSlug}) => {
          const isBaseSlugMatch = existingBundleSlug?.match(suffixRegex)
          if (!isBaseSlugMatch) return existingSuffixes

          const suffixNumber = parseInt(isBaseSlugMatch[1] ?? String(NO_EXISTING_SLUG), 10)
          existingSuffixes.push(suffixNumber)

          return existingSuffixes
        }, [])
        .sort((aSuffix, bSuffix) => bSuffix - aSuffix)

      if (!descExistingSlugSuffixes.length) return NO_EXISTING_SLUG
      const [maxSuffix] = descExistingSlugSuffixes
      const maxNextSuffix =
        maxSuffix + (descExistingSlugSuffixes.includes(NO_EXISTING_SLUG) ? 1 : 0)

      const lowestAvailableSuffix =
        Array.from({length: maxNextSuffix}, (_, index) => index).find(
          (index) => !descExistingSlugSuffixes.includes(index),
        ) ?? undefined
      if (lowestAvailableSuffix === undefined) return maxSuffix + 1

      return lowestAvailableSuffix
    },
    [bundles],
  )

  const generateSlugFromTitle = useCallback(
    (pickedTitle: string) => {
      const newSlug = speakingurl(pickedTitle)
      const nextAvailableSuffixForSlug = getMinimumAvailableSuffixForSlug(newSlug)

      // newSlug doesn't exist yet
      if (nextAvailableSuffixForSlug === NO_EXISTING_SLUG) return newSlug

      return `${newSlug}-${nextAvailableSuffixForSlug}`
    },
    [getMinimumAvailableSuffixForSlug],
  )

  return generateSlugFromTitle
}
