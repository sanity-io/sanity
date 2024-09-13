import {useCallback} from 'react'

import {MenuItem} from '../../../ui-components'
import {useStudioAnnouncements} from './useStudioAnnouncements'

export function StudioAnnouncementsMenuItem({text}: {text: string}) {
  const {onDialogOpen, studioAnnouncements} = useStudioAnnouncements()

  const handleOpenDialog = useCallback(() => {
    onDialogOpen('all')
  }, [onDialogOpen])

  if (studioAnnouncements.length === 0) return null
  return <MenuItem tone="default" text={text} onClick={handleOpenDialog} />
}
