import {createClient} from '@sanity/client'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {SANITY_VERSION} from 'sanity'

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
        }
      })
  }, [client])

  useEffect(() => {
    if (!isCardOpen) {
      setTimeout(() => setIsCardOpen(true), 1000)
    }
  }, [isCardOpen])

  const handleCardClose = useCallback(() => {
    setIsCardOpen(false)
  }, [])
  const handleCardClick = useCallback(() => {
    setIsDialogOpen(true)
    setIsCardOpen(false)
  }, [])

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false)
  }, [])
  if (!unseenDocuments.length) return null
  return (
    <>
      <StudioAnnouncementCard
        title={unseenDocuments[0].title}
        announcementType={unseenDocuments[0].announcementType}
        onCardClick={handleCardClick}
        isOpen={isCardOpen}
        onCardClose={handleCardClose}
      />
      {isDialogOpen && (
        <StudioAnnouncementDialog unseenDocuments={unseenDocuments} onClose={handleDialogClose} />
      )}
    </>
  )
}
