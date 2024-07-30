import {useToast} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useBundles, usePerspective} from 'sanity'

export const useBundleDeleted = () => {
  const {currentGlobalBundle} = usePerspective()
  const {data: bundles, deletedBundles} = useBundles()
  const toast = useToast()
  const [checkedOutBundleSlug, setCheckedOutBundleSlug] = useState<string | undefined>()
  const {slug: currentGlobalBundleSlug} = currentGlobalBundle

  useEffect(() => {
    if (!checkedOutBundleSlug || !Object.keys(deletedBundles).length || !bundles?.length) return

    const hasCheckedOutBundleBeenDeleted = Boolean(deletedBundles[checkedOutBundleSlug])

    if (hasCheckedOutBundleBeenDeleted) {
      const {title: deletedBundleTitle} = deletedBundles[checkedOutBundleSlug]

      toast.push({
        status: 'error',
        title: `The ${deletedBundleTitle} bundle has been deleted.`,
        closable: false,
      })
    }

    setCheckedOutBundleSlug(currentGlobalBundleSlug)
  }, [bundles?.length, checkedOutBundleSlug, currentGlobalBundleSlug, deletedBundles, toast])
}
