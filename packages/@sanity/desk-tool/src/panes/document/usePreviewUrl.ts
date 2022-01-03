import {SanityDocument} from '@sanity/types'
import {TimelineController} from '@sanity/base/_internal'
import {resolveProductionPreviewUrl} from '../../TODO'

export function getPreviewUrl(
  timelineController: TimelineController,
  value: Partial<SanityDocument> | null
): string | null | undefined {
  const {revTime} = timelineController
  const rev = revTime ? revTime.id : null

  if (!value || !resolveProductionPreviewUrl) {
    return null
  }

  try {
    return resolveProductionPreviewUrl(value, rev)
  } catch (error) {
    error.message = `An error was thrown while trying to get production preview url: ${error.message}`
    // eslint-disable-next-line no-console
    console.error(error)
    return null
  }
}
