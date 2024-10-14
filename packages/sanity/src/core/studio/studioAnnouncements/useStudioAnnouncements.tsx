import {useContext} from 'react'
import {StudioAnnouncementContext} from 'sanity/_singletons'

import {type StudioAnnouncementsContextValue} from './types'

export function useStudioAnnouncements(): StudioAnnouncementsContextValue {
  const context = useContext(StudioAnnouncementContext)
  if (!context) {
    throw new Error('useStudioAnnouncements: missing context value')
  }

  return context
}
