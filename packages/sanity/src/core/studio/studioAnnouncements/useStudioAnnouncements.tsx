import {useContext} from 'react'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {type StudioAnnouncementsContextValue} from './types'

export function useStudioAnnouncements(): StudioAnnouncementsContextValue {
  const context = useContext(StudioAnnouncementContext)

  if (!context) {
    return {
      studioAnnouncements: [],
      unseenAnnouncements: [],
      // eslint-disable-next-line no-empty-function
      onDialogOpen: () => {},
    }
  }

  return context
}
