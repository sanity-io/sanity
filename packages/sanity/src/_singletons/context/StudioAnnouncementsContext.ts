import type {StudioAnnouncementsContextValue} from '../../core/studio/studioAnnouncements/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const StudioAnnouncementContext = createContext<StudioAnnouncementsContextValue | undefined>(
  'sanity/_singletons/context/studioAnnouncements',
  undefined,
)
