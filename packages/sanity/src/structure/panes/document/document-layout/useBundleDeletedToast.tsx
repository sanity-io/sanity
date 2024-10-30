import {Text, useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {
  isDraftPerspective,
  isPublishedPerspective,
  Translate,
  usePerspective,
  useReleases,
  useTranslation,
} from 'sanity'

export const useBundleDeletedToast = () => {
  const {currentGlobalBundle} = usePerspective()
  const {data: bundles} = useReleases()
  const toast = useToast()
  const {t} = useTranslation()

  useEffect(() => {
    if (isPublishedPerspective(currentGlobalBundle) || isDraftPerspective(currentGlobalBundle))
      return

    const hasCheckedOutBundleBeenArchived = currentGlobalBundle.state === 'archived'

    if (hasCheckedOutBundleBeenArchived) {
      const {
        metadata: {title: deletedBundleTitle},
        _id: deletedBundleId,
      } = currentGlobalBundle

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
  }, [bundles?.length, toast, t, currentGlobalBundle])
}
