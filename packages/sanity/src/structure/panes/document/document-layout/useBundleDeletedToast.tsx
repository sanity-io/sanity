import {Text, useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {Translate, useBundles, usePerspective, useTranslation} from 'sanity'

export const useBundleDeletedToast = () => {
  const {currentGlobalBundle} = usePerspective()
  const {data: bundles, deletedBundles} = useBundles()
  const toast = useToast()
  const {t} = useTranslation()
  const {slug: currentGlobalBundleSlug} = currentGlobalBundle

  useEffect(() => {
    if (!currentGlobalBundleSlug || !Object.keys(deletedBundles).length || !bundles?.length) return

    const hasCheckedOutBundleBeenDeleted = Boolean(deletedBundles[currentGlobalBundleSlug])

    if (hasCheckedOutBundleBeenDeleted) {
      const {title: deletedBundleTitle, slug: deletedBundleSlug} =
        deletedBundles[currentGlobalBundleSlug]

      toast.push({
        id: `bundle-deleted-toast-${deletedBundleSlug}`,
        status: 'warning',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="bundle.deleted-toast-title"
              values={{title: deletedBundleTitle}}
            />
          </Text>
        ),
        duration: 10000,
      })
    }
  }, [bundles?.length, currentGlobalBundleSlug, deletedBundles, toast, t])
}
