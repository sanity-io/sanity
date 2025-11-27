import {type ReleaseDocument} from '@sanity/client'
import {Text, useToast} from '@sanity/ui'
import {type ReactNode, useEffect, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {useTranslation} from '../i18n/hooks/useTranslation'
import {Translate} from '../i18n/Translate'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useArchivedReleases} from '../releases/store/useArchivedReleases'
import {LATEST, PUBLISHED} from '../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isPublishedPerspective} from '../releases/util/util'
import {useWorkspace} from '../studio/workspace'
import {EMPTY_ARRAY} from '../util/empty'
import {isCardinalityOneRelease} from '../util/releaseUtils'
import {PerspectiveProvider} from './PerspectiveProvider'
import {type ReleaseId} from './types'
import {usePerspective} from './usePerspective'
import {useSetPerspective} from './useSetPerspective'

const getToastTitleAndDescription = (
  archived?: ReleaseDocument,
): {title: string; description?: string} => {
  if (!archived) return {title: 'release.toast.not-found-release.title'}

  if (archived.state === 'published') {
    if (isCardinalityOneRelease(archived)) {
      return {
        title: 'release.toast.scheduled-draft-published.title',
      }
    }
    return {
      title: 'release.toast.published-release.title',
      description: 'release.toast.published-release.description',
    }
  }

  return {
    title: 'release.toast.archived-release.title',
    description: 'release.toast.archived-release.description',
  }
}

const ResetPerspectiveHandler = () => {
  const toast = useToast()
  const {t} = useTranslation()
  const {data: releases, loading: releasesLoading} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()
  const {selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()

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

      const {title, description} = getToastTitleAndDescription(archived)

      toast.push({
        id: `bundle-deleted-toast-${selectedPerspectiveName}`,
        status: 'warning',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey={title}
              values={{title: archived?.metadata?.title || selectedPerspectiveName}}
            />
          </Text>
        ),
        description: description && (
          <Text muted size={1}>
            <Translate t={t} i18nKey={description} />
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
  return null
}

/**
 * This component is not meant to be exported by `sanity`, it's meant only for internal use from the `<StudioProvider>` file.
 * It sets the `<PerspectiveProvider>` listening to the changes happening in the router.
 *
 * If you need to add the PerspectiveProvider you should use that component directly.
 * It's up to you to define how the selectedPerspectiveName and excludedPerspectives should worl.
 */
export function GlobalPerspectiveProvider({children}: {children: ReactNode}) : React.JSX.Element {
  const router = useRouter()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  let selectedPerspectiveName = router.stickyParams.perspective as
    | 'published'
    | ReleaseId
    | undefined

  if (!isDraftModelEnabled && typeof selectedPerspectiveName === 'undefined') {
    selectedPerspectiveName = PUBLISHED
  }

  const excludedPerspectives = useMemo(
    () => router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY,
    [router.stickyParams.excludedPerspectives],
  )

  return (
    <PerspectiveProvider
      selectedPerspectiveName={selectedPerspectiveName}
      excludedPerspectives={excludedPerspectives}
    >
      {children}
      <ResetPerspectiveHandler />
    </PerspectiveProvider>
  )
}
