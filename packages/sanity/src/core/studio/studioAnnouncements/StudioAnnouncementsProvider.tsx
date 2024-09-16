import {createClient} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {SANITY_VERSION} from '../../version'
import {
  StudioAnnouncementCardClicked,
  StudioAnnouncementCardDismissed,
  StudioAnnouncementCardSeen,
  StudioAnnouncementModalDismissed,
} from './__telemetry__/studioAnnouncements.telemetry'
import {studioAnnouncementQuery} from './query'
import {StudioAnnouncementsCard} from './StudioAnnouncementsCard'
import {StudioAnnouncementsDialog} from './StudioAnnouncementsDialog'
import {
  type DialogMode,
  type StudioAnnouncementDocument,
  type StudioAnnouncementsContextValue,
} from './types'
import {useSeenAnnouncements} from './useSeenAnnouncements'
import {isValidAudience} from './utils'

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

  const unseenAnnouncements: StudioAnnouncementDocument[] = useMemo(() => {
    // If it's loading return an empty array to avoid showing the card
    if (seenAnnouncements === 'loading') return []
    // If none is seen, return all the announcements
    if (!seenAnnouncements) return studioAnnouncements

    // Filter out the seen announcements
    const unseen = studioAnnouncements.filter((doc) => !seenAnnouncements.includes(doc._id))
    if (unseen.length > 0) {
      telemetry.log(StudioAnnouncementCardSeen)
    }
    return unseen
  }, [seenAnnouncements, studioAnnouncements, telemetry])
  useEffect(() => {
    // TODO: Replace for internal api
    const client = createClient({projectId: '3do82whm', dataset: 'next'})

    const subscription = client.observable
      .fetch<StudioAnnouncementDocument[]>(studioAnnouncementQuery)
      .subscribe({
        next: (docs) => {
          const validDocs = docs.filter((doc) => isValidAudience(doc, SANITY_VERSION))
          setStudioAnnouncements(validDocs)
        },
        error: (error) => {
          console.error('Error fetching studio announcements:', error)
        },
      })
    return () => subscription.unsubscribe()
  }, [])

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
      unseenAnnouncements,
      onDialogOpen: handleOpenDialog,
    }),
    [handleOpenDialog, unseenAnnouncements, studioAnnouncements],
  )

  return (
    <StudioAnnouncementContext.Provider value={contextValue}>
      {children}
      {unseenAnnouncements.length > 0 && (
        <>
          {!isCardDismissed && (
            <StudioAnnouncementsCard
              title={unseenAnnouncements[0].title}
              announcementType={unseenAnnouncements[0].announcementType}
              onCardClick={handleCardClick}
              isOpen={!isCardDismissed}
              onCardDismiss={handleCardDismiss}
            />
          )}
          {dialogMode && (
            <StudioAnnouncementsDialog
              unseenDocuments={dialogMode === 'all' ? studioAnnouncements : unseenAnnouncements}
              onClose={handleDialogClose}
            />
          )}
        </>
      )}
    </StudioAnnouncementContext.Provider>
  )
}
