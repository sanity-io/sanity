import {Text, useToast} from '@sanity/ui'
import {type ReactNode, useEffect} from 'react'

import {useTranslation} from '../i18n/hooks/useTranslation'
import {Translate} from '../i18n/Translate'
import {usePerspective} from '../releases/hooks/usePerspective'
import {useReleases} from '../releases/store/useReleases'
import {LATEST} from '../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isPublishedPerspective} from '../releases/util/util'

export function PerspectiveProvider({children}: {children: ReactNode}) {
  const toast = useToast()
  const {t} = useTranslation()
  const {data: releases, archivedReleases, loading: releasesLoading} = useReleases()
  const {selectedPerspectiveName, setPerspective} = usePerspective()

  useEffect(() => {
    // clear the perspective param when it is not an active release
    if (
      releasesLoading ||
      !selectedPerspectiveName ||
      isPublishedPerspective(selectedPerspectiveName)
    )
      return
    const isCurrentPerspectiveValid = releases.some(
      (release) => getReleaseIdFromReleaseDocumentId(release._id) === selectedPerspectiveName,
    )
    if (!isCurrentPerspectiveValid) {
      setPerspective(LATEST)
      const archived = archivedReleases.find(
        (r) => getReleaseIdFromReleaseDocumentId(r._id) === selectedPerspectiveName,
      )

      toast.push({
        id: `bundle-deleted-toast-${selectedPerspectiveName}`,
        status: 'warning',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey={
                archived
                  ? 'release.toast.archived-release.title'
                  : 'release.toast.not-found-release.title'
              }
              values={{title: archived?.metadata?.title || selectedPerspectiveName}}
            />
          </Text>
        ),
        duration: 10000,
      })
    }
  }, [
    archivedReleases,
    selectedPerspectiveName,
    releases,
    releasesLoading,
    setPerspective,
    toast,
    t,
  ])

  return <>{children}</>
}
