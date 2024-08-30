import {Text, useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {Translate, useBundles, usePerspective, useTranslation} from 'sanity'

export const useBundleDeletedToast = () => {
  const {currentGlobalBundle} = usePerspective()
  const {data: bundles, deletedBundles} = useBundles()
  const toast = useToast()
  const {t} = useTranslation()
  const {_id: currentGlobalBundleId} = currentGlobalBundle

  useEffect(() => {
    if (!currentGlobalBundleId || !Object.keys(deletedBundles).length || !bundles?.length) return

    const hasCheckedOutBundleBeenDeleted = Boolean(deletedBundles[currentGlobalBundleId])

    if (hasCheckedOutBundleBeenDeleted) {
      const {title: deletedBundleTitle, _id: deletedBundleId} =
        deletedBundles[currentGlobalBundleId]

      toast.push({
        id: `bundle-deleted-toast-${deletedBundleId}`,
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
  }, [bundles?.length, currentGlobalBundleId, deletedBundles, toast, t])
}
