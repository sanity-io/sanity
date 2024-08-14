import {useCallback} from 'react'
import speakingurl from 'speakingurl'

import {useBundles} from '../../../store/bundles'

const PROTECTED_SLUGS = ['drafts', 'published']

export function useGetBundleSlug() {
  const {data: bundles} = useBundles()

  // From existing bundles:
  // if slug doesn't exist, return -1
  // if slug does exist, return the highest suffix number (or 0 if no suffix)
  const getMaxSuffixForSlug = useCallback(
    (baseSlug: string): number => {
      if (!bundles) return -1

      const suffixRegex = new RegExp(`^${baseSlug}(?:-(\\d+))?$`)
      return [...bundles, ...PROTECTED_SLUGS.map((slug) => ({slug}))].reduce(
        (maxSlugSuffix, {slug}) => {
          const isBaseSlugMatch = slug.match(suffixRegex)
          if (!isBaseSlugMatch) return maxSlugSuffix

          const suffixNumber = parseInt(isBaseSlugMatch[1] || '0', 10)
          return Math.max(maxSlugSuffix, suffixNumber)
        },
        -1,
      )
    },
    [bundles],
  )

  const generateSlugFromTitle = useCallback(
    (pickedTitle: string) => {
      const newSlug = speakingurl(pickedTitle)
      const existingSlugMaxSuffix = getMaxSuffixForSlug(newSlug)

      // newSlug doesn't exist yet
      if (existingSlugMaxSuffix === -1) return newSlug

      return `${newSlug}-${existingSlugMaxSuffix + 1}`
    },
    [getMaxSuffixForSlug],
  )

  return generateSlugFromTitle
}
