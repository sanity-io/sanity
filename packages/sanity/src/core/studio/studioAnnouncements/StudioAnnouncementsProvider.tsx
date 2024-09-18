/* eslint-disable camelcase */
import {createClient} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useWorkspace} from 'sanity'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {SANITY_VERSION} from '../../version'
import {
  ProductAnnouncementCardClicked,
  ProductAnnouncementCardDismissed,
  ProductAnnouncementCardSeen,
  ProductAnnouncementModalDismissed,
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
import {isValidAnnouncementAudience, isValidAnnouncementRole} from './utils'

interface StudioAnnouncementsProviderProps {
  children: React.ReactNode
}
/**
 * @internal
 * @hidden
 */
export function StudioAnnouncementsProvider({children}: StudioAnnouncementsProviderProps) {
  const telemetry = useTelemetry()
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null)
  const [isCardDismissed, setIsCardDismissed] = useState(false)
  const [studioAnnouncements, setStudioAnnouncements] = useState<StudioAnnouncementDocument[]>([])
  const [seenAnnouncements, setSeenAnnouncements] = useSeenAnnouncements()
  const {currentUser} = useWorkspace()

  const unseenAnnouncements: StudioAnnouncementDocument[] = useMemo(() => {
    // If it's loading return an empty array to avoid showing the card
    if (seenAnnouncements === 'loading') return []
    // If none is seen, return all the announcements
    if (!seenAnnouncements) return studioAnnouncements

    // Filter out the seen announcements
    const unseen = studioAnnouncements.filter((doc) => !seenAnnouncements.includes(doc._id))
    if (unseen.length > 0) {
      telemetry.log(ProductAnnouncementCardSeen, {
        announcement_id: unseen[0]._id,
        announcement_title: unseen[0].title,
        source: 'studio',
        studio_version: SANITY_VERSION,
      })
    }
    return unseen
  }, [seenAnnouncements, studioAnnouncements, telemetry])

  useEffect(() => {
    // TODO: Replace for internal api
    const client = createClient({
      projectId: 'm5jza465',
      dataset: 'dev',
      useCdn: false,
      apiVersion: 'vX',
    })

    const subscription = client.observable
      .fetch<StudioAnnouncementDocument[]>(studioAnnouncementQuery)
      .subscribe({
        next: (docs) => {
          const validDocs = docs.filter(
            (doc) =>
              isValidAnnouncementAudience(
                {audience: doc.audience, studioVersion: doc.studioVersion},
                SANITY_VERSION,
              ) && isValidAnnouncementRole(doc.audienceRole, currentUser?.roles),
          )
          setStudioAnnouncements(validDocs)
        },
        error: (error) => {
          console.error('Error fetching studio announcements:', error)
        },
      })
    // eslint-disable-next-line consistent-return
    return () => subscription.unsubscribe()
  }, [currentUser?.roles])

  const saveSeenAnnouncements = useCallback(() => {
    // Mark all the announcements as seen
    setSeenAnnouncements(studioAnnouncements.map((doc) => doc._id))
  }, [setSeenAnnouncements, studioAnnouncements])

  const handleOpenDialog = useCallback((mode: DialogMode) => {
    setDialogMode(mode)
    setIsCardDismissed(true)
  }, [])

  const handleCardDismiss = useCallback(() => {
    saveSeenAnnouncements()
    setIsCardDismissed(true)
    telemetry.log(ProductAnnouncementCardDismissed, {
      announcement_id: unseenAnnouncements[0]?._id,
      announcement_title: unseenAnnouncements[0]?.title,
      source: 'studio',
      studio_version: SANITY_VERSION,
    })
  }, [saveSeenAnnouncements, telemetry, unseenAnnouncements])

  const handleCardClick = useCallback(() => {
    handleOpenDialog('card')
    telemetry.log(ProductAnnouncementCardClicked, {
      announcement_id: unseenAnnouncements[0]?._id,
      announcement_title: unseenAnnouncements[0]?.title,
      source: 'studio',
      studio_version: SANITY_VERSION,
    })
  }, [handleOpenDialog, telemetry, unseenAnnouncements])

  const handleDialogClose = useCallback(() => {
    const firstAnnouncement =
      dialogMode === 'help_menu' ? studioAnnouncements[0] : unseenAnnouncements[0]

    telemetry.log(ProductAnnouncementModalDismissed, {
      announcement_id: firstAnnouncement?._id,
      announcement_title: firstAnnouncement?.title,
      source: 'studio',
      studio_version: SANITY_VERSION,
      origin: dialogMode ?? 'card',
    })

    setDialogMode(null)
    saveSeenAnnouncements()
  }, [dialogMode, studioAnnouncements, unseenAnnouncements, telemetry, saveSeenAnnouncements])

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
          mode={dialogMode}
          announcements={dialogMode === 'help_menu' ? studioAnnouncements : unseenAnnouncements}
          onClose={handleDialogClose}
        />
      )}
    </StudioAnnouncementContext.Provider>
  )
}
