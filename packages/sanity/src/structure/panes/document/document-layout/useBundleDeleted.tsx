import {Text, useToast} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useBundles, usePerspective, useTranslation} from 'sanity'

import {releasesLocaleNamespace} from '../../../../core/releases/i18n'

export const useBundleDeleted = () => {
  const {currentGlobalBundle} = usePerspective()
  const {data: bundles, deletedBundles} = useBundles()
  const toast = useToast()
  const {t} = useTranslation(releasesLocaleNamespace)
  const [checkedOutBundleSlug, setCheckedOutBundleSlug] = useState<string | undefined>()
  const {slug: currentGlobalBundleSlug} = currentGlobalBundle

  useEffect(() => setCheckedOutBundleSlug(currentGlobalBundleSlug), [currentGlobalBundleSlug])

  useEffect(() => {
    if (!checkedOutBundleSlug || !Object.keys(deletedBundles).length || !bundles?.length) return

    const hasCheckedOutBundleBeenDeleted = Boolean(deletedBundles[checkedOutBundleSlug])

    if (hasCheckedOutBundleBeenDeleted) {
      const {title: deletedBundleTitle} = deletedBundles[checkedOutBundleSlug]

      toast.push({
        status: 'warning',
        title: (
          <Text muted size={1}>
            {t('deleted-release', {title: deletedBundleTitle})}
          </Text>
        ),
        closable: false,
        duration: 10000,
      })
    }
  }, [bundles?.length, checkedOutBundleSlug, currentGlobalBundleSlug, deletedBundles, toast, t])
}
