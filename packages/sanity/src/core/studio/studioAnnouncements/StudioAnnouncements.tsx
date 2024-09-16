import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useState} from 'react'

import {
  StudioAnnouncementCardClicked,
  StudioAnnouncementCardDismissed,
  StudioAnnouncementModalDismissed,
} from './__telemetry__/studioAnnouncements.telemetry'
import {StudioAnnouncementsCard} from './StudioAnnouncementsCard'
import {StudioAnnouncementsDialog} from './StudioAnnouncementsDialog'
import {type DialogMode} from './types'
import {useStudioAnnouncements} from './useStudioAnnouncements'

interface StudioAnnouncementsProps {
  setSeenAnnouncements: (ids: string[]) => void
}
/**
 * @internal
 * @hidden
 */
export function StudioAnnouncements({setSeenAnnouncements}: StudioAnnouncementsProps) {
  const telemetry = useTelemetry()
  const [dialogMode, setDialogMode] = useState<DialogMode | null>()
  const [isCardDismissed, setIsCardDismissed] = useState(false)
  const {studioAnnouncements, unseenAnnouncements} = useStudioAnnouncements()

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

  if (!unseenAnnouncements.length) {
    return null
  }

  return (
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
  )
}
