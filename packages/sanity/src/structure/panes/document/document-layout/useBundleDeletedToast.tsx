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
  const {selectedPerspective} = usePerspective()
  const {data: bundles} = useReleases()
  const toast = useToast()
  const {t} = useTranslation()

  useEffect(() => {
    if (isPublishedPerspective(selectedPerspective) || isDraftPerspective(selectedPerspective))
      return

    const hasCheckedOutBundleBeenArchived = selectedPerspective.state === 'archived'

    if (hasCheckedOutBundleBeenArchived) {
      const {
        metadata: {title: deletedBundleTitle},
        _id: deletedBundleId,
      } = selectedPerspective

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
  }, [bundles?.length, toast, t, selectedPerspective])
}
