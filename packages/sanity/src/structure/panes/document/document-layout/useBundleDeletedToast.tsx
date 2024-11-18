import {Text, useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {Translate, useCurrentRelease, useReleases, useTranslation} from 'sanity'

export const useBundleDeletedToast = () => {
  const currentRelease = useCurrentRelease()
  const {data: bundles} = useReleases()
  const toast = useToast()
  const {t} = useTranslation()

  useEffect(() => {
    if (!currentRelease) return

    const hasCheckedOutBundleBeenArchived = currentRelease.state === 'archived'

    if (hasCheckedOutBundleBeenArchived) {
      const {
        metadata: {title: deletedBundleTitle},
        _id: deletedBundleId,
      } = currentRelease

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
  }, [bundles?.length, toast, t, currentRelease])
}
