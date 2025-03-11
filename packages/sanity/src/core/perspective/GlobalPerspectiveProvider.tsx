import {Text, useToast} from '@sanity/ui'
import {type ReactNode, useEffect, useMemo, useRef} from 'react'
import {useRouter} from 'sanity/router'

import {useTranslation} from '../i18n/hooks/useTranslation'
import {Translate} from '../i18n/Translate'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useArchivedReleases} from '../releases/store/useArchivedReleases'
import {LATEST} from '../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isPublishedPerspective} from '../releases/util/util'
import {EMPTY_ARRAY} from '../util/empty'
import {PerspectiveProvider} from './PerspectiveProvider'
import {type ReleaseId} from './types'
import {usePerspective} from './usePerspective'
import {useSetPerspective} from './useSetPerspective'

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
  return null
}

/**
 * This component is not meant to be exported by `sanity`, it's meant only for internal use from the `<StudioProvider>` file.
 * It sets the `<PerspectiveProvider>` listening to the changes happening in the router.
 *
 * If you need to add the PerspectiveProvider you should use that component directly.
 * It's up to you to define how the selectedPerspectiveName and excludedPerspectives should worl.
 */
export function GlobalPerspectiveProvider({children}: {children: ReactNode}) {
  const router = useRouter()
  const channelRef = useRef<BroadcastChannel | null>(null)

  const selectedPerspectiveName = router.stickyParams.perspective as
    | 'published'
    | ReleaseId
    | undefined

  const excludedPerspectives = useMemo(
    () => router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY,
    [router.stickyParams.excludedPerspectives],
  )

  useEffect(() => {
    channelRef.current = new BroadcastChannel('perspective-sync')

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_PERSPECTIVE') {
        router.navigateStickyParams({
          perspective: event.data.value || '',
        })
      }
    }

    channelRef.current.addEventListener('message', handleMessage)

    return () => {
      if (channelRef.current) {
        channelRef.current.removeEventListener('message', handleMessage)
        channelRef.current.close()
        channelRef.current = null
      }
    }
  }, [router])

  // Broadcast updates when perspective changes
  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({type: 'UPDATE_PERSPECTIVE', value: selectedPerspectiveName})
    }
  }, [selectedPerspectiveName])

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
