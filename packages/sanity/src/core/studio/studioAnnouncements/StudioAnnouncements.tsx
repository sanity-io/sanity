import {createClient} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {SANITY_VERSION} from 'sanity'

import {
  StudioAnnouncementCardClicked,
  StudioAnnouncementCardDismissed,
  StudioAnnouncementCardSeen,
  StudioAnnouncementModalDismissed,
} from './__telemetry__/studioAnnouncements.telemetry'
import {studioAnnouncementQuery} from './query'
import {StudioAnnouncementCard} from './StudioAnnouncementCard'
import {StudioAnnouncementDialog} from './StudioAnnouncementDialog'
import {type StudioAnnouncementDocument} from './types'
import {isValidAudience} from './utils'
/**
 * @internal
 * @hidden
 */
export function StudioAnnouncements() {
  const telemetry = useTelemetry()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCardOpen, setIsCardOpen] = useState(false)
  const [unseenDocuments, setUnseenDocuments] = useState<StudioAnnouncementDocument[]>([])
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
        const unseen = docs
        setUnseenDocuments(unseen)
        if (unseen.length > 0) {
          setIsCardOpen(true)
          telemetry.log(StudioAnnouncementCardSeen)
        }
      })
  }, [client, telemetry])

  /**
   * TODO: Remove this before merging
   */
  useEffect(() => {
    if (!isCardOpen) {
      setTimeout(() => setIsCardOpen(true), 1000)
    }
  }, [isCardOpen])

  const handleCardDismiss = useCallback(() => {
    setIsCardOpen(false)
    telemetry.log(StudioAnnouncementCardDismissed)
  }, [telemetry])

  const handleCardClick = useCallback(() => {
    setIsDialogOpen(true)
    setIsCardOpen(false)
    telemetry.log(StudioAnnouncementCardClicked)
  }, [telemetry])

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false)
    telemetry.log(StudioAnnouncementModalDismissed)
  }, [telemetry])

  if (!unseenDocuments.length) return null
  return (
    <>
      <StudioAnnouncementCard
        title={unseenDocuments[0].title}
        announcementType={unseenDocuments[0].announcementType}
        onCardClick={handleCardClick}
        isOpen={isCardOpen}
        onCardDismiss={handleCardDismiss}
      />
      {isDialogOpen && (
        <StudioAnnouncementDialog unseenDocuments={unseenDocuments} onClose={handleDialogClose} />
      )}
    </>
  )
}
