import {createClient} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {SANITY_VERSION, useKeyValueStore} from 'sanity'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {
  StudioAnnouncementCardClicked,
  StudioAnnouncementCardDismissed,
  StudioAnnouncementCardSeen,
  StudioAnnouncementModalDismissed,
} from './__telemetry__/studioAnnouncements.telemetry'
import {studioAnnouncementQuery} from './query'
import {StudioAnnouncementCard} from './StudioAnnouncementCard'
import {StudioAnnouncementDialog} from './StudioAnnouncementDialog'
import {
  type DialogMode,
  type StudioAnnouncementDocument,
  type StudioAnnouncementsContextValue,
} from './types'
import {isValidAudience} from './utils'

const KEY = 'studio-announcements-seen'

/**
 * TODO: This is not functional yet, the API is not accepting the key
 */
function useSeenAnnouncements(): [string[] | null | 'loading', (seen: string[]) => void] {
  // Handles the communication with the key value store
  const keyValueStore = useKeyValueStore()
  const seenAnnouncements$ = useMemo(
    () => keyValueStore.getKey(KEY) as Observable<string[] | null>,
    [keyValueStore],
  )
  const seenAnnouncements = useObservable(seenAnnouncements$, 'loading')

  const setSeenAnnouncements = useCallback((seen: string[]) => {
    // keyValueStore.setKey(KEY, seen)
  }, [])

  return [seenAnnouncements, setSeenAnnouncements]
}

interface StudioAnnouncementsProviderProps {
  children: React.ReactNode
}
/**
 * @internal
 * @hidden
 */
export function StudioAnnouncementsProvider({children}: StudioAnnouncementsProviderProps) {
  const telemetry = useTelemetry()
  const [dialogMode, setDialogMode] = useState<DialogMode | null>()
  const [isCardDismissed, setIsCardDismissed] = useState(false)
  const [studioAnnouncements, setStudioAnnouncements] = useState<StudioAnnouncementDocument[]>([])
  const [seenAnnouncements, setSeenAnnouncements] = useSeenAnnouncements()

  const unseenDocuments: StudioAnnouncementDocument[] = useMemo(() => {
    // If it's loading return an empty array to avoid showing the card
    if (seenAnnouncements === 'loading') return []
    if (studioAnnouncements.length === 0) return []
    // If none is seen, return all the announcements
    if (!seenAnnouncements) return [studioAnnouncements[0]]

    // Filter out the seen announcements
    const unseen = studioAnnouncements.filter((doc) => !seenAnnouncements.includes(doc._id))
    if (unseen.length > 0) {
      telemetry.log(StudioAnnouncementCardSeen)
    }
    return unseen
  }, [seenAnnouncements, studioAnnouncements, telemetry])

  // TODO: Replace for internal api
  const client = useMemo(
    () =>
      createClient({
        projectId: '3do82whm',
        dataset: 'next',
      }),
    [],
  )

  useEffect(() => {
    client.observable
      .fetch<StudioAnnouncementDocument[]>(studioAnnouncementQuery)
      .subscribe((docs) => {
        docs.map((doc) => {
          const isValid = isValidAudience(doc, SANITY_VERSION)
          if (!isValid) return null
          return doc
        })
        // TODO: Validate unseen documents with the keyValueStore
        setStudioAnnouncements(docs)
      })
  }, [client, telemetry])

  /**
   * TODO: Remove this before merging
   */
  useEffect(() => {
    if (isCardDismissed) {
      setTimeout(() => setIsCardDismissed(false), 1000)
    }
  }, [isCardDismissed])

  const handleOpenDialog = useCallback((mode: DialogMode) => {
    setDialogMode(mode)
    setIsCardDismissed(true)
  }, [])

  const handleCardDismiss = useCallback(() => {
    // Mark all the announcements as seen
    setSeenAnnouncements(studioAnnouncements.map((doc) => doc._id))
    setIsCardDismissed(true)
    telemetry.log(StudioAnnouncementCardDismissed)
  }, [setSeenAnnouncements, studioAnnouncements, telemetry])

  const handleCardClick = useCallback(() => {
    handleOpenDialog('unseen')
    telemetry.log(StudioAnnouncementCardClicked)
  }, [handleOpenDialog, telemetry])

  const handleDialogClose = useCallback(() => {
    setDialogMode(null)
    setSeenAnnouncements(studioAnnouncements.map((doc) => doc._id))
    telemetry.log(StudioAnnouncementModalDismissed)
  }, [telemetry, setSeenAnnouncements, studioAnnouncements])

  const contextValue: StudioAnnouncementsContextValue = useMemo(
    () => ({
      studioAnnouncements,
      unseenDocuments,
      onDialogOpen: handleOpenDialog,
    }),
    [handleOpenDialog, unseenDocuments, studioAnnouncements],
  )

  return (
    <StudioAnnouncementContext.Provider value={contextValue}>
      {children}
      {unseenDocuments.length > 0 && (
        <>
          <StudioAnnouncementCard
            title={unseenDocuments[0].title}
            announcementType={unseenDocuments[0].announcementType}
            onCardClick={handleCardClick}
            isOpen={!isCardDismissed}
            onCardDismiss={handleCardDismiss}
          />
          {dialogMode && (
            <StudioAnnouncementDialog
              unseenDocuments={dialogMode === 'all' ? studioAnnouncements : unseenDocuments}
              onClose={handleDialogClose}
            />
          )}
        </>
      )}
    </StudioAnnouncementContext.Provider>
  )
}
