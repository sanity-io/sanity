import {createContext} from 'react'

import type {StudioAnnouncementsContextValue} from '../../core/studio/studioAnnouncements/types'

/**
 * @internal
 */
export const StudioAnnouncementContext = createContext<StudioAnnouncementsContextValue | undefined>(
  undefined,
)
