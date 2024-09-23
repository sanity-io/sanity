/* eslint-disable camelcase */
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback} from 'react'

import {MenuItem} from '../../../ui-components'
import {SANITY_VERSION} from '../../version'
import {WhatsNewHelpMenuItemClicked} from './__telemetry__/studioAnnouncements.telemetry'
import {useStudioAnnouncements} from './useStudioAnnouncements'

export function StudioAnnouncementsMenuItem({text}: {text: string}) {
  const {onDialogOpen, studioAnnouncements} = useStudioAnnouncements()
  const telemetry = useTelemetry()

  const handleOpenDialog = useCallback(() => {
    onDialogOpen('help_menu')
    telemetry.log(WhatsNewHelpMenuItemClicked, {
      source: 'studio',
      announcement_id: studioAnnouncements[0]?._id,
      announcement_title: studioAnnouncements[0]?.title,
      announcement_internal_name: studioAnnouncements[0]?.name,
      studio_version: SANITY_VERSION,
    })
  }, [onDialogOpen, studioAnnouncements, telemetry])

  if (studioAnnouncements.length === 0) return null
  return <MenuItem tone="default" text={text} onClick={handleOpenDialog} />
}
