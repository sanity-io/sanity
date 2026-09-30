import {use} from 'react'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {type StudioAnnouncementsContextValue} from './types'

export function useStudioAnnouncements(): StudioAnnouncementsContextValue {
  const context = use(StudioAnnouncementContext)

  if (!context) {
    return {
      studioAnnouncements: [],
      unseenAnnouncements: [],
      onDialogOpen: () => {},
    }
  }

  return context
}
