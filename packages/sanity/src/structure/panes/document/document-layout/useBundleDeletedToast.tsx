import {Text, useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {Translate, usePerspective, useReleases, useTranslation} from 'sanity'

export const useBundleDeletedToast = () => {
  const {currentGlobalBundle} = usePerspective()
  const {data: bundles, deletedReleases} = useReleases()
  const toast = useToast()
  const {t} = useTranslation()
  const {_id: currentGlobalBundleId} = currentGlobalBundle

  useEffect(() => {
    if (!currentGlobalBundleId || !Object.keys(deletedReleases).length || !bundles?.length) return

    const hasCheckedOutBundleBeenDeleted = Boolean(deletedReleases[currentGlobalBundleId])

    if (hasCheckedOutBundleBeenDeleted) {
      const {
        metadata: {title: deletedBundleTitle},
        _id: deletedBundleId,
      } = deletedReleases[currentGlobalBundleId]

      toast.push({
        id: `bundle-deleted-toast-${deletedBundleId}`,
        status: 'warning',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="release.deleted-toast-title"
              values={{title: deletedBundleTitle}}
            />
          </Text>
        ),
        duration: 10000,
      })
    }
  }, [bundles?.length, currentGlobalBundleId, deletedReleases, toast, t])
}
