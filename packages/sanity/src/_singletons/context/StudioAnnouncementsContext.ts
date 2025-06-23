import {createContext} from 'sanity/_createContext'

import type {StudioAnnouncementsContextValue} from '../../core/studio/studioAnnouncements/types'

/**
 * @internal
 */
export const StudioAnnouncementContext: React.Context<StudioAnnouncementsContextValue | undefined> =
  createContext<StudioAnnouncementsContextValue | undefined>(
    'sanity/_singletons/context/studioAnnouncements',
    undefined,
  )
