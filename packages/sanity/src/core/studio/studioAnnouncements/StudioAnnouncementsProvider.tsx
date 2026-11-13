import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable} from 'rxjs'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {useClient} from '../../hooks/useClient'
import {useSource} from '../../studio/source'
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
const EMPTY: StudioAnnouncementDocument[] = []

function StudioAnnouncementsProviderInner({children}: StudioAnnouncementsProviderProps) {
  const telemetry = useTelemetry()
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null)
  const [isCardDismissed, setIsCardDismissed] = useState(false)
  const [seenAnnouncements, setSeenAnnouncements] = useSeenAnnouncements()
  const {currentUser} = useWorkspace()
  const client = useClient(CLIENT_OPTIONS)

  const announcements$: Observable<StudioAnnouncementDocument[]> = useMemo(
    () =>
      client.observable
        .request<StudioAnnouncementDocument[] | null>({url: '/journey/announcements'})
        .pipe(
          map((docs) =>
            (docs ?? []).filter(
              (doc) =>
                isValidAnnouncementAudience(
                  {audience: doc.audience, studioVersion: doc.studioVersion},
                  SANITY_VERSION,
                ) && isValidAnnouncementRole(doc.audienceRole, currentUser?.roles),
            ),
          ),
          catchError(() => []),
        ),
    [client.observable, currentUser?.roles],
  )

  const studioAnnouncements = useObservable(announcements$, EMPTY)
  const unseenAnnouncements = useMemo(
    () =>
      seenAnnouncements
        ? studioAnnouncements.filter((doc) => !seenAnnouncements.includes(doc._id))
        : EMPTY,
    [seenAnnouncements, studioAnnouncements],
  )

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
      announcement_internal_name: unseenAnnouncements[0]?.name,
      source: 'studio',
      studio_version: SANITY_VERSION,
    })
  }, [saveSeenAnnouncements, telemetry, unseenAnnouncements])

  const handleCardClick = useCallback(() => {
    handleOpenDialog('card')
    telemetry.log(ProductAnnouncementCardClicked, {
      announcement_id: unseenAnnouncements[0]?._id,
      announcement_title: unseenAnnouncements[0]?.title,
      announcement_internal_name: unseenAnnouncements[0]?.name,
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
      announcement_internal_name: firstAnnouncement?.name,
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
          preHeader={unseenAnnouncements[0].preHeader}
          title={unseenAnnouncements[0].title}
          name={unseenAnnouncements[0].name}
          id={unseenAnnouncements[0]._id}
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

/**
 * @internal
 * @hidden
 */
export function StudioAnnouncementsProvider(props: StudioAnnouncementsProviderProps) {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const source = useSource()

  if (source.announcements?.enabled) {
    return <StudioAnnouncementsProviderInner {...props} />
  }
  return props.children
}
