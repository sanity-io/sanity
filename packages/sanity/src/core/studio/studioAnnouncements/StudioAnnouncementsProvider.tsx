/* eslint-disable camelcase */
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {useClient} from '../../hooks/useClient'
import {useWorkspace} from '../../studio/workspace'
import {SANITY_VERSION} from '../../version'
import {
  ProductAnnouncementCardClicked,
  ProductAnnouncementCardDismissed,
  ProductAnnouncementModalDismissed,
} from './__telemetry__/studioAnnouncements.telemetry'
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
const CLIENT_OPTIONS = {apiVersion: 'v2024-09-19'}

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
  const client = useClient(CLIENT_OPTIONS)

  const unseenAnnouncements: StudioAnnouncementDocument[] = useMemo(() => {
    // If it's loading or it has errored return an empty array to avoid showing the card
    if (seenAnnouncements.loading || seenAnnouncements.error) return []
    // If none is seen, return all the announcements
    if (!seenAnnouncements.value) return studioAnnouncements

    // Filter out the seen announcements
    const unseen = studioAnnouncements.filter((doc) => !seenAnnouncements.value?.includes(doc._id))

    return unseen
  }, [seenAnnouncements, studioAnnouncements])

  useEffect(() => {
    const request = client.observable
      .request<StudioAnnouncementDocument[] | null>({url: '/journey/announcements'})
      .subscribe({
        next: (docs) => {
          if (!docs) return
          const validDocs = docs.filter(
            (doc) =>
              isValidAnnouncementAudience(
                {audience: doc.audience, studioVersion: doc.studioVersion},
                SANITY_VERSION,
              ) && isValidAnnouncementRole(doc.audienceRole, currentUser?.roles),
          )
          setStudioAnnouncements(validDocs)
        },
        error: () => {
          /* silently ignore any error */
        },
      })
    // eslint-disable-next-line consistent-return
    return () => request.unsubscribe()
  }, [currentUser?.roles, client])

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
          id={unseenAnnouncements[0]._id}
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
