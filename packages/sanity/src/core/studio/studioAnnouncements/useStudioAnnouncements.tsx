import {type StudioAnnouncementsContextValue} from './types'
import {useContext} from 'react'
import {StudioAnnouncementContext} from 'sanity/_singletons'

export function useStudioAnnouncements(): StudioAnnouncementsContextValue {
  const context = useContext(StudioAnnouncementContext)

  if (!context) {
    return {
      studioAnnouncements: [],
      unseenAnnouncements: [],
      onDialogOpen: () => {},
    }
  }

  return context
}
