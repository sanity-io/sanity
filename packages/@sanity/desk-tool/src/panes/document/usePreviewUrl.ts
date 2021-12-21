import {SanityDocument} from '@sanity/types'
import {resolveProductionPreviewUrl} from '../../TODO'
import {Controller as HistoryController} from './documentHistory/history/Controller'

export function getPreviewUrl(
  historyController: HistoryController,
  value: Partial<SanityDocument> | null
): string | null | undefined {
  const {revTime} = historyController
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
